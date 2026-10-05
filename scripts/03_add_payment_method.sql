-- Migration: Add payment_method column to orders table
-- Run this in Supabase SQL Editor if the column doesn't exist yet

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'online';

-- Ensure status constraint includes 'processing' (for Razorpay payment flow)
DO $$
BEGIN
  -- Drop existing status constraint if it doesn't include 'processing'
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND conname = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END;
$$;

-- Re-add status constraint with all valid statuses
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'shipped'));
