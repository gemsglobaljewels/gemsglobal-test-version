-- ============================================================
-- Migration: Fix Order Status Constraint + Inventory Sync RPC
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- ── STEP 1: Drop ALL check constraints on orders table that reference 'status'
-- (This handles both named constraints AND unnamed inline constraints from CREATE TABLE)
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
    RAISE NOTICE 'Dropping constraint: %', r.conname;
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

-- ── STEP 2: Add the single correct status constraint with ALL valid values
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'payment_failed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  ));

-- ── STEP 3: Add payment_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'orders'
      AND column_name  = 'payment_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_id TEXT;
    RAISE NOTICE 'Added payment_id column to orders';
  ELSE
    RAISE NOTICE 'payment_id column already exists';
  END IF;
END;
$$;

-- ── STEP 4: Recreate the RPC with SECURITY DEFINER
DROP FUNCTION IF EXISTS confirm_order_and_reduce_stock(UUID);
DROP FUNCTION IF EXISTS confirm_order_and_reduce_stock(UUID, TEXT);

CREATE OR REPLACE FUNCTION confirm_order_and_reduce_stock(
  p_order_id   UUID,
  p_payment_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_order      RECORD;
  v_item       RECORD;
  v_product    RECORD;
  v_new_status TEXT := 'confirmed';
BEGIN
  -- Lock the order row to prevent concurrent confirmation
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE LOG '[RPC] Order not found: %', p_order_id;
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;

  RAISE LOG '[RPC] Order % current status: %', p_order_id, v_order.status;

  -- Idempotency: skip if already confirmed/processed
  IF v_order.status IN ('confirmed', 'completed', 'processing', 'shipped', 'delivered') THEN
    RAISE LOG '[RPC] Order % already confirmed/processed (status: %)', p_order_id, v_order.status;
    RETURN json_build_object(
      'success', true,
      'message', 'Order already completed. Inventory was previously updated.',
      'already_processed', true
    );
  END IF;

  -- Only process pending or payment_failed orders
  IF v_order.status NOT IN ('pending', 'payment_failed') THEN
    RAISE LOG '[RPC] Order % in non-processable status: %', p_order_id, v_order.status;
    RETURN json_build_object(
      'success', false,
      'message', 'Order cannot be confirmed. Current status: ' || v_order.status
    );
  END IF;

  -- Pre-validate stock for ALL items before touching anything
  FOR v_item IN (
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  ) LOOP
    SELECT id, name, stock_quantity INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_item.product_id;
    END IF;

    RAISE LOG '[RPC] Stock check — product: %, have: %, need: %',
      v_product.name, COALESCE(v_product.stock_quantity, 0), v_item.quantity;

    IF COALESCE(v_product.stock_quantity, 0) < v_item.quantity THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Insufficient stock for: ' || v_product.name ||
                   ' (have ' || COALESCE(v_product.stock_quantity, 0)::TEXT ||
                   ', need ' || v_item.quantity::TEXT || ')'
      );
    END IF;
  END LOOP;

  -- Reduce stock and log inventory movements
  FOR v_item IN (
    SELECT oi.product_id, oi.quantity,
           p.name          AS product_name,
           p.stock_quantity AS current_stock
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
  ) LOOP
    DECLARE
      v_new_stock INTEGER;
    BEGIN
      v_new_stock := GREATEST(0, COALESCE(v_item.current_stock, 0) - v_item.quantity);

      RAISE LOG '[RPC] Reducing stock % → % for %',
        v_item.current_stock, v_new_stock, v_item.product_name;

      UPDATE public.products
      SET stock_quantity = v_new_stock,
          updated_at     = NOW()
      WHERE id = v_item.product_id;

      INSERT INTO public.inventory_movements
        (product_id, product_name, change, quantity_after, reason, created_at)
      VALUES
        (v_item.product_id, v_item.product_name, -v_item.quantity, v_new_stock,
         'Order: ' || p_order_id::TEXT, NOW());
    END;
  END LOOP;

  -- Confirm the order
  UPDATE public.orders
  SET status     = v_new_status,
      payment_id = COALESCE(p_payment_id, payment_id),
      updated_at = NOW()
  WHERE id = p_order_id;

  RAISE LOG '[RPC] Order % marked % with payment_id %', p_order_id, v_new_status, p_payment_id;

  RETURN json_build_object(
    'success',    true,
    'message',    'Order confirmed and inventory updated',
    'order_id',   p_order_id,
    'new_status', v_new_status
  );

EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[RPC] EXCEPTION for order %: %', p_order_id, SQLERRM;
  RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION confirm_order_and_reduce_stock(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_order_and_reduce_stock(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION confirm_order_and_reduce_stock(UUID, TEXT) TO service_role;

-- ── STEP 5: Verify everything is correct ──────────────────────────────────────
-- Should show the new constraint with all statuses including 'completed' and 'failed'
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass AND contype = 'c'
ORDER BY conname;

-- Should show security_definer = true
SELECT proname, prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'confirm_order_and_reduce_stock';
