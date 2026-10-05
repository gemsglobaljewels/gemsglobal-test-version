-- Migration: Expand orders.status check constraint to include all workflow states
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing restrictive constraint
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Re-add with full set of statuses (matches admin UI options)
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'failed',
    'refunded'
  ));

-- Step 3: Also add payment_method column if it doesn't exist
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'online';
