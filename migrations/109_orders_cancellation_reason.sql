-- 109: customer-supplied cancellation reason, shown in the admin order view.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason text;

