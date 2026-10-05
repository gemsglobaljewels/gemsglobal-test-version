-- ════════════════════════════════════════════════════════════════
-- Ensures the columns used by order emails + the success page exist.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- Run this in the Supabase SQL editor (or psql) BEFORE testing emails.
-- ════════════════════════════════════════════════════════════════

-- Courier / shipment tracking number (set by admin on the order edit page).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT DEFAULT NULL;

-- "Internal Notes" field (already exists in most installs; kept here for safety).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Optional: quick check of the columns after running.
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'orders'
--   AND column_name IN ('tracking_number', 'notes');
