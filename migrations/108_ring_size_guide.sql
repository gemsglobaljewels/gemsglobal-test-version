-- Ring Size Guide (single-row config document)
-- Run this in Supabase SQL Editor
--
-- Holds all admin-managed content for the public /ring-size-guide page:
--   - welcome message, importance text, "how to measure" heading
--   - measure_steps : [{ id, icon, title, text }]      (icon = lucide name, whitelisted)
--   - chart_columns : [{ id, label }]                  (e.g. "Diameter (mm)", "US", "India")
--   - chart_rows    : [{ id, cells: { [columnId]: "value" } }]
--
-- Columns AND rows are fully dynamic, so a single JSON document is the cleanest fit
-- (atomic save, trivial add/remove). Enforced as a singleton via CHECK (id = 1).

CREATE TABLE IF NOT EXISTS public.ring_size_guide (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  welcome       TEXT,
  importance    TEXT,
  measure_title TEXT,
  measure_steps JSONB DEFAULT '[]'::jsonb,
  chart_columns JSONB DEFAULT '[]'::jsonb,
  chart_rows    JSONB DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ring_size_guide_singleton CHECK (id = 1)
);

-- Seed the single row with sensible defaults if the table is empty.
INSERT INTO public.ring_size_guide (id, welcome, importance, measure_title, measure_steps, chart_columns, chart_rows)
VALUES (
  1,
  'Finding your perfect ring size is the first step towards a piece you will treasure forever. This quick guide will help you measure accurately from the comfort of your home.',
  'A well-fitting ring should slide over your knuckle with a little resistance and sit comfortably without pinching. Too loose and it may slip off; too tight and it becomes uncomfortable to wear. Getting the size right ensures lasting comfort and protects your investment.',
  'How to measure your ring size',
  '[
    {"id":"s1","icon":"Scissors","title":"Cut a strip of paper","text":"Take a thin strip of paper or string, about 10 cm long and less than 1 cm wide."},
    {"id":"s2","icon":"Hand","title":"Wrap it around your finger","text":"Wrap the strip snugly around the base of the intended finger, below the knuckle."},
    {"id":"s3","icon":"PencilRuler","title":"Mark and measure","text":"Mark where the paper overlaps, then measure the length in millimetres with a ruler."},
    {"id":"s4","icon":"Ruler","title":"Match it to the chart","text":"Compare your circumference or diameter to the chart below to find your size."}
  ]'::jsonb,
  '[
    {"id":"c_dia","label":"Diameter (mm)"},
    {"id":"c_circ","label":"Circumference (mm)"},
    {"id":"c_india","label":"India"},
    {"id":"c_us","label":"US / Canada"},
    {"id":"c_uk","label":"UK"}
  ]'::jsonb,
  '[
    {"id":"r1","cells":{"c_dia":"14.0","c_circ":"44.0","c_india":"6","c_us":"3","c_uk":"F"}},
    {"id":"r2","cells":{"c_dia":"14.9","c_circ":"46.8","c_india":"8","c_us":"4","c_uk":"H"}},
    {"id":"r3","cells":{"c_dia":"15.7","c_circ":"49.3","c_india":"10","c_us":"5","c_uk":"J"}},
    {"id":"r4","cells":{"c_dia":"16.5","c_circ":"51.9","c_india":"12","c_us":"6","c_uk":"L"}},
    {"id":"r5","cells":{"c_dia":"17.3","c_circ":"54.4","c_india":"14","c_us":"7","c_uk":"N"}},
    {"id":"r6","cells":{"c_dia":"18.2","c_circ":"57.0","c_india":"16","c_us":"8","c_uk":"P"}},
    {"id":"r7","cells":{"c_dia":"19.0","c_circ":"59.5","c_india":"18","c_us":"9","c_uk":"R"}}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security: chart/content is public to read, writes go through service_role only.
ALTER TABLE IF EXISTS public.ring_size_guide ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view ring_size_guide" ON public.ring_size_guide;
CREATE POLICY "Public can view ring_size_guide" ON public.ring_size_guide
  FOR SELECT USING (true);

GRANT ALL ON TABLE public.ring_size_guide TO service_role;
GRANT SELECT ON TABLE public.ring_size_guide TO authenticated;
GRANT SELECT ON TABLE public.ring_size_guide TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
