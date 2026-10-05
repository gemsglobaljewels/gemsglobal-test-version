-- Size Guide (single-row config document)
-- Run this in the Supabase SQL Editor. Idempotent — safe to re-run.
--
-- Drives the public /size-guide page (comprehensive Ring + Bracelet + Diamond
-- sizing guide) — DISTINCT from the ring-only /ring-size-guide page.
--
-- Holds all admin-managed content:
--   - hero     : { eyebrow, title, subtitle, background_url }
--   - sections : [{ id, title, subtitle, image_url, video_url, video_type,
--                   tips:[{ id, icon, title, text }],
--                   steps:[{ id, image_url, text }] }]
--
-- Sections + their nested tips/steps are fully dynamic (add / remove / reorder),
-- so a single JSON document is the cleanest fit (atomic save, trivial mutation).
-- Enforced as a singleton via CHECK (id = 1). Mirrors migrations/108_ring_size_guide.sql.

CREATE TABLE IF NOT EXISTS public.size_guide (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  hero       JSONB DEFAULT '{}'::jsonb,
  sections   JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT size_guide_singleton CHECK (id = 1)
);

-- Seed the single row with the default guide (Ring / Bracelet / Diamond) if empty.
-- Media (images/videos) are left blank so the admin uploads their own assets to R2.
INSERT INTO public.size_guide (id, hero, sections)
VALUES (
  1,
  '{
    "eyebrow": "Size Master Guide",
    "title": "Find your perfect jewelry fit",
    "subtitle": "Effortlessly determine your ideal ring, bracelet, and diamond sizes with our comprehensive Size Master Guide. Ensure a perfect fit for every piece with easy-to-use charts and expert tips — and shop with confidence.",
    "background_url": ""
  }'::jsonb,
  '[
    {
      "id": "sg_default_ring",
      "title": "Ring Size Chart",
      "subtitle": "Measure the base of your finger and match it to your perfect ring size in minutes.",
      "image_url": "",
      "video_url": "",
      "video_type": "file",
      "tips": [
        {"id":"sg_ring_t1","icon":"Ruler","title":"Measure Your Finger","text":"Wrap a thin strip of paper or a piece of string around the base of your finger. Mark where it overlaps, then measure the length against a ruler."},
        {"id":"sg_ring_t2","icon":"Table2","title":"Refer to Size Chart","text":"Compare your measurement with our ring size chart to find your corresponding size."},
        {"id":"sg_ring_t3","icon":"BadgeCheck","title":"Ensure Accuracy","text":"For the best fit, measure your finger at the end of the day when your fingers are at their largest. Consider the width of the band for snug fits."}
      ],
      "steps": [
        {"id":"sg_ring_s1","image_url":"","text":"Cut out the sizer strip from the printed page."},
        {"id":"sg_ring_s2","image_url":"","text":"Wear it as a ring and mark where it meets your fit."},
        {"id":"sg_ring_s3","image_url":"","text":"Read the size on the scale to find your ring size."}
      ]
    },
    {
      "id": "sg_default_bracelet",
      "title": "Bracelet Size Chart",
      "subtitle": "Measure the widest part of your hand so your bangle slides on with a comfortable, secure fit.",
      "image_url": "",
      "video_url": "",
      "video_type": "file",
      "tips": [
        {"id":"sg_brac_t1","icon":"Hand","title":"Measure Your Hand","text":"Close your fingers together and bring your thumb to your little finger. Use a measuring tape or string to measure the widest part of your hand — this is where the bangle will slide over."},
        {"id":"sg_brac_t2","icon":"Search","title":"Find Your Measurement","text":"If using a string, mark where it meets and measure the length against a ruler to find the circumference of your hand."},
        {"id":"sg_brac_t3","icon":"Scale","title":"Match Your Size","text":"Compare your measurement to our bracelet size chart to find the size that fits you best."}
      ],
      "steps": [
        {"id":"sg_brac_s1","image_url":"","text":"Cut out the bangle sizer strip from the page."},
        {"id":"sg_brac_s2","image_url":"","text":"Wear it as shown in the image and point it out."},
        {"id":"sg_brac_s3","image_url":"","text":"Measure it by the scale and you will get your bangle size."}
      ]
    },
    {
      "id": "sg_default_diamond",
      "title": "Diamond Size Chart",
      "subtitle": "Understand how carat weight translates to millimeters so you can picture your stone before it is set.",
      "image_url": "",
      "video_url": "",
      "video_type": "file",
      "tips": [
        {"id":"sg_diam_t1","icon":"Gem","title":"Understand Carat Weight","text":"Diamond size is often expressed in carats, a measurement of weight, not size. One carat is equivalent to 0.2 grams."},
        {"id":"sg_diam_t2","icon":"Scale","title":"Consider Proportions","text":"Look at the diamond''s cut and shape, as these factors influence how large the diamond appears. A well-cut diamond can appear larger than its carat weight might suggest."},
        {"id":"sg_diam_t3","icon":"Eye","title":"View Size Charts","text":"Consult size charts that compare diamond carat weights to their approximate sizes in millimeters. This helps you visualize how different carat weights will look in your jewelry setting."}
      ],
      "steps": [
        {"id":"sg_diam_s1","image_url":"","text":"Cut out any shape from the diamond sizer page."},
        {"id":"sg_diam_s2","image_url":"","text":"Wear it as shown in the image and point it out."},
        {"id":"sg_diam_s3","image_url":"","text":"Measure it by the scale and you will get your diamond size."}
      ]
    }
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security: content is public to read, writes go through service_role only.
ALTER TABLE IF EXISTS public.size_guide ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view size_guide" ON public.size_guide;
CREATE POLICY "Public can view size_guide" ON public.size_guide
  FOR SELECT USING (true);

GRANT ALL ON TABLE public.size_guide TO service_role;
GRANT SELECT ON TABLE public.size_guide TO authenticated;
GRANT SELECT ON TABLE public.size_guide TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
