-- Atomic RPC to confirm order and reduce stock
-- This ensures that inventory is ONLY reduced if there is enough stock
-- and prevents duplicate reductions (idempotency).

CREATE OR REPLACE FUNCTION confirm_order_and_reduce_stock(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_product_name TEXT;
    v_current_stock INTEGER;
    v_new_status TEXT := 'completed'; -- Using 'completed' as per user requirements
BEGIN
    -- 1. Check if order exists and lock it for update to prevent concurrent confirmation
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    
    IF v_order.id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Order not found');
    END IF;

    -- 2. Idempotency check: If order is already processed, return success
    -- We only allow confirmation if the current status is 'pending' or 'payment_failed' (retry)
    IF v_order.status NOT IN ('pending', 'payment_failed') THEN
        RETURN json_build_object('success', true, 'message', 'Order already processed. Current status: ' || v_order.status, 'already_processed', true);
    END IF;

    -- 3. Check stock for all items first (Pre-validation)
    FOR v_item IN (SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id) LOOP
        SELECT stock_quantity, name INTO v_current_stock, v_product_name 
        FROM public.products 
        WHERE id = v_item.product_id 
        FOR UPDATE; -- Lock the product row

        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product is out of stock: %', v_item.product_id;
        END IF;

        IF v_current_stock < v_item.quantity THEN
            RETURN json_build_object('success', false, 'message', 'Insufficient stock for product: ' || v_product_name);
        END IF;
    END LOOP;

    -- 4. Reduce stock for each item
    FOR v_item IN (SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id) LOOP
        UPDATE public.products 
        SET stock_quantity = stock_quantity - v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id;
        
        -- Optional: Log inventory movement
        -- INSERT INTO public.inventory_movements (product_id, change, reason, created_at)
        -- VALUES (v_item.product_id, -v_item.quantity, 'Order Confirmation: ' || p_order_id, NOW());
    END LOOP;

    -- 5. Update order status to confirmed/processing
    UPDATE public.orders 
    SET status = v_new_status, 
        updated_at = NOW() 
    WHERE id = p_order_id;

    RETURN json_build_object(
        'success', true, 
        'message', 'Order confirmed and inventory synchronized successfully',
        'order_id', p_order_id,
        'new_status', v_new_status
    );

EXCEPTION WHEN OTHERS THEN
    -- PostgreSQL automatically rolls back the transaction on EXCEPTION
    RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;
