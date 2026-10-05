-- Add payment_failed status for orders that drop off at the gateway
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'payment_failed';
