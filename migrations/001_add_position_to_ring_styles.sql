-- Migration 001: Add position column to ring_styles and diamond_shapes
-- Run this SQL in your Supabase SQL Editor

-- For ring_styles
ALTER TABLE ring_styles 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ring_styles_position 
ON ring_styles (position ASC, name ASC);

-- For diamond_shapes (optional, if you also want ordering for shapes)
ALTER TABLE diamond_shapes 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_diamond_shapes_position 
ON diamond_shapes (position ASC, name ASC);

-- Optional: Set initial positions for existing styles
-- Uncomment and adjust as needed
-- UPDATE ring_styles SET position = 0 WHERE key = 'solitaire';
-- UPDATE ring_styles SET position = 1 WHERE key = 'three-stone';
-- UPDATE ring_styles SET position = 2 WHERE key = 'halo';
-- UPDATE ring_styles SET position = 3 WHERE key = 'floral-inspired';
-- UPDATE ring_styles SET position = 4 WHERE key = 'hidden-halo';
