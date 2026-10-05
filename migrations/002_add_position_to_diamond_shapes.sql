-- Add position column to diamond_shapes table if it doesn't exist
ALTER TABLE diamond_shapes ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing rows to have position based on key order
WITH ranked AS (
  SELECT key, ROW_NUMBER() OVER (ORDER BY key) - 1 AS pos
  FROM diamond_shapes
)
UPDATE diamond_shapes ds
SET position = r.pos
FROM ranked r
WHERE ds.key = r.key;

-- Add index for faster ordering
CREATE INDEX IF NOT EXISTS idx_diamond_shapes_position ON diamond_shapes(position);