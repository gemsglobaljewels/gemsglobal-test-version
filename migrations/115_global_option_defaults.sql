-- ============================================================
-- 115 - Global Option Defaults (Metal / Carat / Size)
-- ============================================================
-- Ye migration global default prices ko realistic values set karta hai
-- taaki admin ko har product me dubara 0 se price nahi dalna pade.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. GLOBAL METAL OPTIONS — realistic USD price_modifier defaults
-- (Agar pehle se koi non-zero value hai to wo preserve rahega - COALESCE)
-- ------------------------------------------------------------
UPDATE public.metal_options
SET price_modifier = CASE key
  WHEN '10k-yellow-gold'      THEN COALESCE(NULLIF(price_modifier, 0), 200)::NUMERIC
  WHEN '10k-white-gold'       THEN COALESCE(NULLIF(price_modifier, 0), 250)::NUMERIC
  WHEN '10k-rose-gold'        THEN COALESCE(NULLIF(price_modifier, 0), 250)::NUMERIC
  WHEN '14k-yellow-gold'      THEN COALESCE(NULLIF(price_modifier, 0), 450)::NUMERIC
  WHEN '14k-white-gold'       THEN COALESCE(NULLIF(price_modifier, 0), 500)::NUMERIC
  WHEN '14k-rose-gold'        THEN COALESCE(NULLIF(price_modifier, 0), 500)::NUMERIC
  WHEN '18k-yellow-gold'      THEN COALESCE(NULLIF(price_modifier, 0), 750)::NUMERIC
  WHEN '18k-white-gold'       THEN COALESCE(NULLIF(price_modifier, 0), 800)::NUMERIC
  WHEN '18k-rose-gold'        THEN COALESCE(NULLIF(price_modifier, 0), 800)::NUMERIC
  WHEN '22k-yellow-gold'      THEN COALESCE(NULLIF(price_modifier, 0), 1000)::NUMERIC
  WHEN '24k-yellow-gold'      THEN COALESCE(NULLIF(price_modifier, 0), 1400)::NUMERIC
  WHEN 'platinum-950'         THEN COALESCE(NULLIF(price_modifier, 0), 1200)::NUMERIC
  WHEN '925-sterling-silver'  THEN COALESCE(NULLIF(price_modifier, 0), 50)::NUMERIC
  WHEN '925-silver'           THEN COALESCE(NULLIF(price_modifier, 0), 50)::NUMERIC
  ELSE COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
END
WHERE price_modifier = 0 OR price_modifier IS NULL;

-- ------------------------------------------------------------
-- 2. GLOBAL CARAT OPTIONS — realistic USD upcharge defaults
-- (Base 0.50 = 0, har level ka realistic jump)
-- ------------------------------------------------------------
UPDATE public.carat_options
SET price_modifier = CASE key
  WHEN '0-25-ct'   THEN COALESCE(NULLIF(price_modifier, 0), -200)::NUMERIC
  WHEN '0-30-ct'   THEN COALESCE(NULLIF(price_modifier, 0), -150)::NUMERIC
  WHEN '0-40-ct'   THEN COALESCE(NULLIF(price_modifier, 0), -75)::NUMERIC
  WHEN '0-50-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '0-75-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 350)::NUMERIC
  WHEN '1-00-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 900)::NUMERIC
  WHEN '1-25-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 1500)::NUMERIC
  WHEN '1-50-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 2300)::NUMERIC
  WHEN '1-75-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 3100)::NUMERIC
  WHEN '2-00-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 4200)::NUMERIC
  WHEN '2-50-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 6100)::NUMERIC
  WHEN '3-00-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 8500)::NUMERIC
  WHEN '4-00-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 14000)::NUMERIC
  WHEN '5-00-ct'   THEN COALESCE(NULLIF(price_modifier, 0), 21000)::NUMERIC
  ELSE COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
END
WHERE price_modifier = 0 OR price_modifier IS NULL;

-- ------------------------------------------------------------
-- 3. GLOBAL SIZE OPTIONS — ring sizes generally free, small delta for extremes
-- ------------------------------------------------------------
UPDATE public.size_options
SET price_modifier = CASE key
  WHEN '3'   THEN COALESCE(NULLIF(price_modifier, 0), -25)::NUMERIC
  WHEN '3-5' THEN COALESCE(NULLIF(price_modifier, 0), -20)::NUMERIC
  WHEN '4'   THEN COALESCE(NULLIF(price_modifier, 0), -15)::NUMERIC
  WHEN '4-5' THEN COALESCE(NULLIF(price_modifier, 0), -10)::NUMERIC
  WHEN '5'   THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '5-5' THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '6'   THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '6-5' THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '7'   THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '7-5' THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '8'   THEN COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
  WHEN '8-5' THEN COALESCE(NULLIF(price_modifier, 0), 15)::NUMERIC
  WHEN '9'   THEN COALESCE(NULLIF(price_modifier, 0), 25)::NUMERIC
  WHEN '9-5' THEN COALESCE(NULLIF(price_modifier, 0), 40)::NUMERIC
  WHEN '10'  THEN COALESCE(NULLIF(price_modifier, 0), 55)::NUMERIC
  WHEN '10-5' THEN COALESCE(NULLIF(price_modifier, 0), 70)::NUMERIC
  WHEN '11'  THEN COALESCE(NULLIF(price_modifier, 0), 85)::NUMERIC
  WHEN '12'  THEN COALESCE(NULLIF(price_modifier, 0), 110)::NUMERIC
  WHEN '13'  THEN COALESCE(NULLIF(price_modifier, 0), 140)::NUMERIC
  WHEN '14'  THEN COALESCE(NULLIF(price_modifier, 0), 175)::NUMERIC
  WHEN '15'  THEN COALESCE(NULLIF(price_modifier, 0), 210)::NUMERIC
  WHEN '16'  THEN COALESCE(NULLIF(price_modifier, 0), 250)::NUMERIC
  ELSE COALESCE(NULLIF(price_modifier, 0), 0)::NUMERIC
END
WHERE price_modifier = 0 OR price_modifier IS NULL;

-- ------------------------------------------------------------
-- 4. PRODUCT SPECIFIC overrides:
--    Agar product_*_options table me abhi bhi price_modifier = 0 hai
--    aur uske corresponding global me koi meaningful value hai,
--    to wo sync kar do (admin ko baar baar 0 se nahi karna padega).
--    Agar product ke paas already non-zero customized price hai → untouched.
-- ------------------------------------------------------------
UPDATE public.product_metal_options pmo
SET price_modifier = mo.price_modifier
FROM public.metal_options mo
WHERE pmo.key = mo.key
  AND (pmo.price_modifier = 0 OR pmo.price_modifier IS NULL)
  AND (mo.price_modifier IS NOT NULL AND mo.price_modifier <> 0);

UPDATE public.product_size_options pso
SET price_modifier = so.price_modifier
FROM public.size_options so
WHERE pso.key = so.key
  AND (pso.price_modifier = 0 OR pso.price_modifier IS NULL)
  AND (so.price_modifier IS NOT NULL AND so.price_modifier <> 0);

UPDATE public.product_carat_options pco
SET price_modifier = co.price_modifier
FROM public.carat_options co
WHERE pco.key = co.key
  AND (pco.price_modifier = 0 OR pco.price_modifier IS NULL)
  AND (co.price_modifier IS NOT NULL AND co.price_modifier <> 0);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
