-- Fix missing currency field in existing orders
-- Run this in Supabase SQL Editor if needed

-- Add currency column if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';

-- Set default currency for existing orders without currency
UPDATE public.orders 
SET currency = 'INR' 
WHERE currency IS NULL OR currency = '';

-- Verify orders have correct currency based on payment method
-- USD orders should have Stripe, INR orders can have Razorpay/COD/Online
SELECT 
  id,
  email,
  total_price,
  currency,
  payment_method,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- Check if currency matches expected payment method
SELECT 
  payment_method,
  currency,
  COUNT(*) as order_count,
  SUM(total_price) as total_revenue
FROM orders
WHERE currency IS NOT NULL
GROUP BY payment_method, currency
ORDER BY payment_method, currency;
