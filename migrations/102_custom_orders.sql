

-- ════════════════════════════════════════════════════════════════════════════
-- CUSTOM ORDERS
-- Customer-submitted bespoke jewellery requests.
--
-- A signed-in customer fills the /custom-order form (title, description,
-- category, metal, budget, processing time, country + contact, quantity and
-- optional reference images). Each submission is stored here and the admin is
-- emailed. Admins review the request in the admin panel and reply — the reply
-- is stored on the row and emailed to the customer (status → 'replied').
--
-- Idempotent: safe to run multiple times (IF NOT EXISTS / guarded DO blocks).
-- Run in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid

-- ── 1. Main table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- customer
  customer_name      VARCHAR(255) NOT NULL,
  customer_email     VARCHAR(255),
  customer_phone     VARCHAR(40),
  country            VARCHAR(120),

  -- request
  title              VARCHAR(255) NOT NULL,
  description        TEXT,
  category           VARCHAR(120),
  metal_preference   VARCHAR(120),
  budget             VARCHAR(120),
  processing_time    VARCHAR(120),
  quantity           INT DEFAULT 1,
  reference_images   JSONB DEFAULT '[]'::jsonb,   -- array of R2 image URLs
  reference_product  VARCHAR(255),                -- product slug when opened from a PDP

  -- lifecycle
  status             VARCHAR(20) NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'in_progress', 'replied', 'closed', 'archived')),

  -- admin reply
  admin_reply        TEXT,
  replied_at         TIMESTAMPTZ,

  -- audit
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill columns for pre-existing installs (in case the table already existed)
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS country           VARCHAR(120);
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS category          VARCHAR(120);
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS metal_preference  VARCHAR(120);
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS budget            VARCHAR(120);
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS processing_time   VARCHAR(120);
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS quantity          INT DEFAULT 1;
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS reference_images  JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS reference_product VARCHAR(255);
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS admin_reply       TEXT;
ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS replied_at        TIMESTAMPTZ;

-- ── 2. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_custom_orders_status  ON public.custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_created ON public.custom_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_orders_email   ON public.custom_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_custom_orders_user    ON public.custom_orders(user_id);

-- ── 3. updated_at trigger (reuses the shared function from 01_init_schema) ──
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

DROP TRIGGER IF EXISTS update_custom_orders_updated_at ON public.custom_orders;
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 4. Row Level Security ───────────────────────────────────────────────────
-- All privileged access flows through the API using the service-role key
-- (which bypasses RLS). Enabling RLS with no anon/authenticated policy simply
-- locks the table down on the public anon REST surface so nobody can read
-- other customers' contact details directly from the client. The create path
-- goes through a server route (service-role), never the anon client.
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Admins (owner/admin) may read/modify every request from an authenticated session.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_orders'
      AND policyname = 'Admins can view custom orders'
  ) THEN
    CREATE POLICY "Admins can view custom orders"
      ON public.custom_orders
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
    WHERE schemaname = 'public' AND tablename = 'custom_orders'
      AND policyname = 'Admins can modify custom orders'
  ) THEN
    CREATE POLICY "Admins can modify custom orders"
      ON public.custom_orders
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
            AND admin_users.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- Done. Table: custom_orders
-- ════════════════════════════════════════════════════════════════════════════
