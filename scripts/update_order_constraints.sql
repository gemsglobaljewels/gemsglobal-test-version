-- Step 1: Drop the existing constraint for order status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Add the updated constraint that includes 'payment_failed'
ALTER TABLE orders ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'));

-- Step 3: Just to properly secure the payment method, update that constraint too if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Step 4: Add the updated payment method constraint that includes 'upi'
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
CHECK (payment_method IN ('cod', 'card', 'upi'));
