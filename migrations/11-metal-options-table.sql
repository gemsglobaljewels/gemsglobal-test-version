-- Metal Options Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS metal_options (
  key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  price_modifier NUMERIC,
  is_enabled BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0
);

-- Insert default metal options if table is empty
INSERT INTO metal_options (key, name, price_modifier, is_enabled, position)
VALUES 
  ('18k-white-gold', '18k White Gold', 0, true, 0),
  ('18k-yellow-gold', '18k Yellow Gold', 0, true, 1),
  ('18k-rose-gold', '18k Rose Gold', 0, true, 2),
  ('platinum-950', 'Platinum 950', 0, true, 3)
ON CONFLICT (key) DO NOTHING;

-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_metal_options_position ON metal_options(position);
