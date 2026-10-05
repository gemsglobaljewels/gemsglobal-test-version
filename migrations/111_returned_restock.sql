-- 111: restock on returns.
--  • update_inventory_on_status_change rebuilt to be flag-based: the
--    orders.inventory_updated flag (not the old→new status pair) decides
--    whether stock is deducted or restored, making every call idempotent.
--  • Stock is now restored when an admin marks an order 'returned',
--    exactly as it already was for 'cancelled' — once per order.

DROP FUNCTION IF EXISTS update_inventory_on_status_change(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_inventory_on_status_change(
  p_order_id   UUID,
  p_old_status TEXT,
  p_new_status TEXT
)
RETURNS JSON AS $$
DECLARE
  v_order      RECORD;
  v_item       RECORD;
  v_movement_id UUID;
  v_new_stock INTEGER;
  v_change INTEGER;
BEGIN
  -- Get the current order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;

  -- SCENARIO 1: Moving TO a stock-deducted status (reduce inventory)
  -- The inventory_updated flag guarantees this runs at most once per order.
  IF p_new_status IN ('confirmed', 'processing', 'shipped', 'delivered', 'completed')
     AND v_order.inventory_updated IS NOT TRUE THEN
    -- Process each item in the order
    FOR v_item IN (
      SELECT oi.product_id, oi.quantity, p.name AS product_name, p.stock_quantity AS current_stock
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = p_order_id
    ) LOOP
      -- Calculate new stock level
      v_new_stock := GREATEST(0, COALESCE(v_item.current_stock, 0) - v_item.quantity);
      v_change := -v_item.quantity;

      -- Update product stock
      UPDATE public.products
      SET stock_quantity = v_new_stock,
          updated_at = NOW()
      WHERE id = v_item.product_id;

      -- Log inventory movement
      INSERT INTO public.inventory_movements (
        product_id,
        product_name,
        change,
        quantity_after,
        reason,
        created_at
      ) VALUES (
        v_item.product_id,
        v_item.product_name,
        v_change,
        v_new_stock,
        'Order ' || p_new_status || ': ' || p_order_id::TEXT,
        NOW()
      ) RETURNING id INTO v_movement_id;

      RAISE NOTICE 'Reduced stock by % for product % (new stock: %)',
        v_item.quantity, v_item.product_name, v_new_stock;
    END LOOP;

    -- Mark order as having inventory updated
    UPDATE public.orders
    SET inventory_updated = TRUE,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN json_build_object(
      'success', true,
      'message', 'Stock reduced successfully',
      'action', 'decreased',
      'order_id', p_order_id,
      'from_status', p_old_status,
      'to_status', p_new_status
    );

  -- SCENARIO 2: Moving TO cancelled or returned (restore inventory)
  -- Only restores when stock was actually deducted, so it can never double-restore.
  ELSIF p_new_status IN ('cancelled', 'returned')
        AND v_order.inventory_updated = TRUE THEN
    -- Process each item in the order
    FOR v_item IN (
      SELECT oi.product_id, oi.quantity, p.name AS product_name, p.stock_quantity AS current_stock
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = p_order_id
    ) LOOP
      -- Calculate new stock level (restore stock)
      v_new_stock := COALESCE(v_item.current_stock, 0) + v_item.quantity;
      v_change := v_item.quantity;

      -- Update product stock
      UPDATE public.products
      SET stock_quantity = v_new_stock,
          updated_at = NOW()
      WHERE id = v_item.product_id;

      -- Log inventory movement
      INSERT INTO public.inventory_movements (
        product_id,
        product_name,
        change,
        quantity_after,
        reason,
        created_at
      ) VALUES (
        v_item.product_id,
        v_item.product_name,
        v_change,
        v_new_stock,
        CASE WHEN p_new_status = 'returned'
          THEN 'Order Returned: ' || p_order_id::TEXT
          ELSE 'Order Cancelled: ' || p_order_id::TEXT
        END,
        NOW()
      ) RETURNING id INTO v_movement_id;

      RAISE NOTICE 'Restored stock by % for product % (new stock: %)',
        v_item.quantity, v_item.product_name, v_new_stock;
    END LOOP;

    -- Mark order as NOT having inventory updated (stock is back on the shelf)
    UPDATE public.orders
    SET inventory_updated = FALSE,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN json_build_object(
      'success', true,
      'message', 'Stock restored successfully',
      'action', 'increased',
      'order_id', p_order_id,
      'from_status', p_old_status,
      'to_status', p_new_status
    );

  -- SCENARIO 3: Other status changes (no inventory impact)
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'No inventory update required',
      'reason', 'Status change does not affect inventory',
      'from_status', p_old_status,
      'to_status', p_new_status
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Inventory update failed: ' || SQLERRM,
    'error_detail', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_inventory_on_status_change(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_inventory_on_status_change(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_inventory_on_status_change(UUID, TEXT, TEXT) TO service_role;
