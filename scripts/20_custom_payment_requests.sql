-- ════════════════════════════════════════════════════════════════════════════
-- CUSTOM PAYMENT REQUESTS
-- Admin-generated payment pages for off-catalogue / bespoke orders.
--
-- An admin creates a request (customer + order details + amount + currency),
-- the system mints a secure unguessable token, and the customer pays on-site
-- via Razorpay (INR) or Stripe (USD). On success the request is marked 'paid'
-- and a matching row is written into `orders` for unified reporting.
--
-- Idempotent: safe to run multiple times (IF NOT EXISTS / guarded DO blocks).
-- Run in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_bytes / gen_random_uuid

-- ── 1. Main table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_payment_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token              TEXT NOT NULL UNIQUE,                 -- secure, unguessable URL slug

  -- customer
  customer_name      VARCHAR(255) NOT NULL,
  customer_email     VARCHAR(255),
  customer_phone     VARCHAR(40),

  -- order
  title              VARCHAR(255) NOT NULL,                -- order title / product name
  description        TEXT,
  amount             DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency           VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD')),

  -- lifecycle
  status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'paid', 'failed', 'archived')),
  expires_at         TIMESTAMPTZ,                          -- NULL = never expires

  -- payment record (populated on success)
  gateway            VARCHAR(20),                          -- 'razorpay' | 'stripe'
  payment_id         VARCHAR(255),                         -- razorpay_payment_id / stripe pi_...
  gateway_order_id   VARCHAR(255),                         -- razorpay order_id / stripe session id
  paid_at            TIMESTAMPTZ,
  order_id           UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  -- audit
  recorded_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  last_sent_at       TIMESTAMPTZ,                          -- last time the link was emailed
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill columns for pre-existing installs (in case the table already existed)
ALTER TABLE public.custom_payment_requests ADD COLUMN IF NOT EXISTS gateway          VARCHAR(20);
ALTER TABLE public.custom_payment_requests ADD COLUMN IF NOT EXISTS payment_id       VARCHAR(255);
ALTER TABLE public.custom_payment_requests ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(255);
ALTER TABLE public.custom_payment_requests ADD COLUMN IF NOT EXISTS paid_at          TIMESTAMPTZ;
ALTER TABLE public.custom_payment_requests ADD COLUMN IF NOT EXISTS order_id         UUID;
ALTER TABLE public.custom_payment_requests ADD COLUMN IF NOT EXISTS last_sent_at     TIMESTAMPTZ;
ALTER TABLE public.custom_payment_requests ADD COLUMN IF NOT EXISTS expires_at       TIMESTAMPTZ;

-- ── 2. Event log (attempts / status transitions — audit trail) ──────────────
CREATE TABLE IF NOT EXISTS public.custom_payment_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES public.custom_payment_requests(id) ON DELETE CASCADE,
  type         VARCHAR(40) NOT NULL,   -- created | link_sent | attempt | paid | failed | archived
  detail       JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Indexes ──────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_cpr_token       ON public.custom_payment_requests(token);
CREATE INDEX        IF NOT EXISTS idx_cpr_status      ON public.custom_payment_requests(status);
CREATE INDEX        IF NOT EXISTS idx_cpr_created     ON public.custom_payment_requests(created_at DESC);
CREATE INDEX        IF NOT EXISTS idx_cpr_email       ON public.custom_payment_requests(customer_email);
CREATE INDEX        IF NOT EXISTS idx_cpe_request     ON public.custom_payment_events(request_id);

-- ── 4. updated_at trigger (reuses the shared function from 01_init_schema) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_custom_payment_requests_updated_at ON public.custom_payment_requests;
CREATE TRIGGER update_custom_payment_requests_updated_at
  BEFORE UPDATE ON public.custom_payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 5. Row Level Security ───────────────────────────────────────────────────
-- All privileged access flows through the API using the service-role key
-- (which bypasses RLS). These policies simply lock the tables down for the
-- anon/authenticated roles so nobody can enumerate or read tokens directly
-- from the client. The public payment page reads its request through a
-- server route, never via the anon client.
ALTER TABLE public.custom_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_payment_events   ENABLE ROW LEVEL SECURITY;

-- Admins (owner/admin) may read every request from an authenticated session.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_payment_requests'
      AND policyname = 'Admins can view custom payment requests'
  ) THEN
    CREATE POLICY "Admins can view custom payment requests"
      ON public.custom_payment_requests
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
            AND admin_users.role IN ('owner', 'admin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_payment_requests'
      AND policyname = 'Admins can modify custom payment requests'
  ) THEN
    CREATE POLICY "Admins can modify custom payment requests"
      ON public.custom_payment_requests
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
            AND admin_users.role IN ('owner', 'admin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_payment_events'
      AND policyname = 'Admins can view custom payment events'
  ) THEN
    CREATE POLICY "Admins can view custom payment events"
      ON public.custom_payment_events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
            AND admin_users.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- ── 6. Atomic "mark paid" RPC ───────────────────────────────────────────────
-- Locks the request row, enforces single-payment (idempotency), records the
-- payment reference + order link and flips status to 'paid'. Returns JSON.
--
-- Called by the verify routes AFTER the gateway signature/session has been
-- verified server-side. Never trust the client with the amount — the caller
-- passes the amount it already validated against the stored request.
CREATE OR REPLACE FUNCTION public.mark_custom_payment_paid(
  p_request_id      UUID,
  p_gateway         TEXT,
  p_payment_id      TEXT,
  p_gateway_order_id TEXT,
  p_order_id        UUID
)
RETURNS JSON AS $$
DECLARE
  v_req RECORD;
BEGIN
  -- Lock the row to serialise concurrent verify calls for the same link.
  SELECT * INTO v_req
  FROM public.custom_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Payment request not found');
  END IF;

  -- Idempotency: already paid → succeed without double-writing.
  IF v_req.status = 'paid' THEN
    RETURN json_build_object(
      'success', true,
      'already_paid', true,
      'message', 'Payment already recorded',
      'payment_id', v_req.payment_id
    );
  END IF;

  -- Archived links can never be paid.
  IF v_req.status = 'archived' THEN
    RETURN json_build_object('success', false, 'message', 'This payment link has been archived');
  END IF;

  -- Expiry guard (NULL expires_at = never expires).
  IF v_req.expires_at IS NOT NULL AND v_req.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'message', 'This payment link has expired');
  END IF;

  UPDATE public.custom_payment_requests
  SET status           = 'paid',
      gateway          = p_gateway,
      payment_id       = p_payment_id,
      gateway_order_id = COALESCE(p_gateway_order_id, gateway_order_id),
      order_id         = COALESCE(p_order_id, order_id),
      paid_at          = NOW(),
      updated_at       = NOW()
  WHERE id = p_request_id;

  INSERT INTO public.custom_payment_events (request_id, type, detail)
  VALUES (p_request_id, 'paid', json_build_object(
    'gateway', p_gateway, 'payment_id', p_payment_id, 'order_id', p_order_id
  ));

  RETURN json_build_object(
    'success', true,
    'message', 'Payment recorded',
    'payment_id', p_payment_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Mark a failed attempt (non-destructive; keeps link retryable) ────────
CREATE OR REPLACE FUNCTION public.mark_custom_payment_failed(
  p_request_id UUID,
  p_reason     TEXT
)
RETURNS JSON AS $$
DECLARE
  v_req RECORD;
BEGIN
  SELECT * INTO v_req
  FROM public.custom_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Payment request not found');
  END IF;

  -- Never downgrade an already-paid request.
  IF v_req.status = 'paid' THEN
    RETURN json_build_object('success', true, 'already_paid', true);
  END IF;

  UPDATE public.custom_payment_requests
  SET status = 'failed', updated_at = NOW()
  WHERE id = p_request_id AND status <> 'paid';

  INSERT INTO public.custom_payment_events (request_id, type, detail)
  VALUES (p_request_id, 'failed', json_build_object('reason', p_reason));

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- Done. Tables: custom_payment_requests, custom_payment_events
--       RPCs:   mark_custom_payment_paid(), mark_custom_payment_failed()
-- ════════════════════════════════════════════════════════════════════════════
