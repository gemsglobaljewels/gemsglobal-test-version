-- Add carat column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS carat VARCHAR(255);
