-- =========================================================================
-- COMPREHENSIVE INVENTORY CONTROL SYSTEM
-- Run this in Supabase SQL Editor
-- =========================================================================
-- This implements proper inventory management based on order status changes:
-- 1. Decrease stock when order moves TO "processing" (or confirmed/shipped/delivered)
-- 2. Increase stock when order is CANCELLED
-- 3. Prevent double-deduction with idempotency checks
-- 4. Track all inventory movements in audit log
-- 5. Ensure stock never goes negative
-- =========================================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS update_inventory_on_status_change(UUID, TEXT, TEXT);

-- Create the master inventory control function
CREATE OR REPLACE FUNCTION update_inventory_on_status_change(
  p_order_id   UUID,
  p_old_status TEXT DEFAULT NULL,
  p_new_status TEXT
)
RETURNS JSON AS $$
DECLARE
  v_order      RECORD;
  v_item       RECORD;
  v_product    RECORD;
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
  
  -- Use provided statuses or fall back to order's current status
  DECLARE
    v_old TEXT := COALESCE(p_old_status, v_order.status);
    v_new TEXT := p_new_status;
  BEGIN
    -- Validate that we're actually changing status
    IF v_old = v_new THEN
      RETURN json_build_object('success', true, 'message', 'Status unchanged - no inventory update needed');
    END IF;
    
    -- Define which statuses mean stock has been deducted
    -- These are "final" states where inventory is committed
    DECLARE
      v_stock_deducted_statuses TEXT[] := ARRAY['confirmed', 'processing', 'shipped', 'delivered', 'completed'];
    BEGIN
      -- SCENARIO 1: Moving TO a stock-deducted status (reduce inventory)
      IF v_old != ALL(v_stock_deducted_statuses) AND v_new = ANY(v_stock_deducted_statuses) THEN
        -- Check if stock was already deducted (idempotency)
        IF v_order.inventory_updated = TRUE THEN
          RETURN json_build_object(
            'success', true,
            'message', 'Inventory already updated for this order',
            'already_processed', true
          );
        END IF;
        
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
            'Order ' || v_new || ': ' || p_order_id::TEXT,
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
          'from_status', v_old,
          'to_status', v_new
        );
      
      -- SCENARIO 2: Moving FROM a stock-deducted status TO cancelled (restore inventory)
      ELSIF v_old = ANY(v_stock_deducted_statuses) AND v_new = 'cancelled' THEN
        -- Check if already cancelled (idempotency)
        IF v_order.status = 'cancelled' THEN
          RETURN json_build_object(
            'success', true,
            'message', 'Order already cancelled',
            'already_processed', true
          );
        END IF;
        
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
            'Order Cancelled: ' || p_order_id::TEXT,
            NOW()
          ) RETURNING id INTO v_movement_id;
          
          RAISE NOTICE 'Restored stock by % for product % (new stock: %)', 
            v_item.quantity, v_item.product_name, v_new_stock;
        END LOOP;
        
        -- Mark order as NOT having inventory updated (since it's cancelled)
        UPDATE public.orders
        SET inventory_updated = FALSE,
            updated_at = NOW()
        WHERE id = p_order_id;
        
        RETURN json_build_object(
          'success', true,
          'message', 'Stock restored successfully',
          'action', 'increased',
          'order_id', p_order_id,
          'from_status', v_old,
          'to_status', v_new
        );
      
      -- SCENARIO 3: Moving FROM cancelled TO a stock-deducted status (UN-cancel, reduce again)
      ELSIF v_old = 'cancelled' AND v_new = ANY(v_stock_deducted_statuses) THEN
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
            'Order Un-cancelled: ' || p_order_id::TEXT,
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
          'message', 'Stock reduced (un-cancelled)',
          'action', 'decreased',
          'order_id', p_order_id,
          'from_status', v_old,
          'to_status', v_new
        );
      
      -- SCENARIO 4: Other status changes (no inventory impact)
      ELSE
        RETURN json_build_object(
          'success', true,
          'message', 'No inventory update required',
          'reason', 'Status change does not affect inventory',
          'from_status', v_old,
          'to_status', v_new
        );
      END IF;
    END;
  END;
  
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

-- Add inventory_updated column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'inventory_updated'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN inventory_updated BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN public.orders.inventory_updated IS 'Tracks whether inventory has been deducted for this order';
  END IF;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_inventory_updated ON orders(inventory_updated);

-- Verification query
SELECT 
  proname as function_name,
  prosrc as source_preview
FROM pg_proc
WHERE proname = 'update_inventory_on_status_change';
