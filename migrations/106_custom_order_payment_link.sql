-- ════════════════════════════════════════════════════════════════════════════
-- CUSTOM ORDER  →  CUSTOM PAYMENT  LINK
--
-- Ties a custom payment request back to the custom order it bills, and to the
-- customer who owns that order. This lets:
--   • the admin create a payment link from a custom order in one click
--     (pre-filled from the request), and
--   • the resulting paid `orders` row carry the customer's user_id so the
--     purchase shows up inside the customer's account (as a custom product).
--
-- It also teaches mark_custom_payment_paid() to advance the linked custom
-- order's fulfilment funnel to 'payment_done' on success — forward-only, so a
-- request already further along (process_complete / place_order) is never
-- dragged backwards.
--
-- Idempotent: safe to run multiple times. Run in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Link columns on custom_payment_requests ──────────────────────────────
--   custom_order_id → the bespoke request this payment bills (nullable: manual
--                     off-catalogue payments have no originating custom order).
--   user_id         → the owning customer, copied from the custom order so the
--                     paid orders row can be attributed to their account.
ALTER TABLE public.custom_payment_requests
  ADD COLUMN IF NOT EXISTS custom_order_id UUID REFERENCES public.custom_orders(id) ON DELETE SET NULL;
ALTER TABLE public.custom_payment_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cpr_custom_order ON public.custom_payment_requests(custom_order_id);
CREATE INDEX IF NOT EXISTS idx_cpr_user        ON public.custom_payment_requests(user_id);

-- ── 2. mark_custom_payment_paid() — now also advances the linked custom order ─
-- Same contract/return shape as before (scripts/20_custom_payment_requests.sql).
-- The only addition: after flipping the request to 'paid', if it is linked to a
-- custom order, advance that order to 'payment_done' — but ONLY when the order
-- is not already at or beyond that stage (forward-only funnel).
--
-- Funnel order (rank): new(0) replied(1) processing(2) payment_done(3)
--                      process_complete(4) place_order(5)
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

  -- Forward-only advance of the linked custom order to 'payment_done'.
  -- array_position on the ordered funnel gives each status a rank; we only move
  -- the order forward when it currently sits before 'payment_done'.
  IF v_req.custom_order_id IS NOT NULL THEN
    UPDATE public.custom_orders
    SET status = 'payment_done', updated_at = NOW()
    WHERE id = v_req.custom_order_id
      AND array_position(
            ARRAY['new','replied','processing','payment_done','process_complete','place_order'],
            status
          ) < array_position(
            ARRAY['new','replied','processing','payment_done','process_complete','place_order'],
            'payment_done'
          );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Payment recorded',
    'payment_id', p_payment_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- Done.
--   custom_payment_requests: + custom_order_id, + user_id
--   mark_custom_payment_paid(): now advances the linked custom order to
--                               'payment_done' (forward-only).
-- ════════════════════════════════════════════════════════════════════════════
