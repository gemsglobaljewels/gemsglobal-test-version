-- ============================================================
-- STEP 1: Run this FIRST — drops ALL check constraints on orders
-- Run in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'c'
  LOOP
    RAISE NOTICE 'Dropping: %', r.conname;
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

-- ============================================================
-- STEP 2: Add back the correct constraints
-- ============================================================

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'completed', 'failed', 'payment_failed',
    'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ));

-- ============================================================
-- STEP 3: Verify — you should see 'completed' and 'failed' in the output
-- ============================================================
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass AND contype = 'c';
