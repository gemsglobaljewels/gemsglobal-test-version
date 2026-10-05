-- 110: customer return flow.
--  • return_reason — customer-supplied reason shown in the admin order view.
--  • status constraint rebuilt to include the return lifecycle states
--    (return_requested → returned) alongside every status already in use.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS return_reason text;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'completed',
    'failed',
    'payment_failed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'canceled',
    'refunded',
    'return_requested',
    'returned'
  ));
