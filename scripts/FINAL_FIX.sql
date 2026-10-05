-- =========================================================================
-- THE FINAL FIX: Run this ENTIRE block in Supabase SQL Editor
-- This fixes BOTH the status constraint AND the inventory update function
-- =========================================================================

-- 1. Add payment_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_id TEXT;
  END IF;
END;
$$;

-- 2. DYNAMICALLY DROP ALL EXISTING STATUS CONSTRAINTS on orders
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
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

-- 3. ADD THE SECURE CONSTRAINT WITH 'confirmed'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'completed', 'failed', 'payment_failed',
    'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ));

-- 4. RECREATE THE SECURITY DEFINER RPC
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
  v_new_status TEXT := 'confirmed'; -- <--- SETS TO CONFIRMED
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;

  -- Idempotency
  IF v_order.status IN ('confirmed', 'completed', 'processing', 'shipped', 'delivered') THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Order already confirmed',
      'already_processed', true
    );
  END IF;

  IF v_order.status NOT IN ('pending', 'payment_failed') THEN
    RETURN json_build_object('success', false, 'message', 'Order cannot be confirmed');
  END IF;

  FOR v_item IN (
    SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  ) LOOP
    SELECT id, name, stock_quantity INTO v_product
    FROM public.products WHERE id = v_item.product_id FOR UPDATE;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product is out of stock: %', v_item.product_id;
    END IF;

    IF COALESCE(v_product.stock_quantity, 0) < v_item.quantity THEN
      RETURN json_build_object('success', false, 'message', 'Insufficient stock for: ' || v_product.name);
    END IF;
  END LOOP;

  FOR v_item IN (
    SELECT oi.product_id, oi.quantity, p.name AS product_name, p.stock_quantity AS current_stock
    FROM public.order_items oi JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
  ) LOOP
    DECLARE v_new_stock INTEGER;
    BEGIN
      v_new_stock := GREATEST(0, COALESCE(v_item.current_stock, 0) - v_item.quantity);
      UPDATE public.products SET stock_quantity = v_new_stock, updated_at = NOW() WHERE id = v_item.product_id;
      INSERT INTO public.inventory_movements (product_id, product_name, change, quantity_after, reason, created_at)
      VALUES (v_item.product_id, v_item.product_name, -v_item.quantity, v_new_stock, 'Order: ' || p_order_id::TEXT, NOW());
    END;
  END LOOP;

  UPDATE public.orders
  SET status = v_new_status, payment_id = COALESCE(p_payment_id, payment_id), updated_at = NOW()
  WHERE id = p_order_id;

  RETURN json_build_object('success', true, 'message', 'Confirmed', 'order_id', p_order_id, 'new_status', v_new_status);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION confirm_order_and_reduce_stock(UUID, TEXT) TO authenticated, anon, service_role;
