-- ════════════════════════════════════════════════════════════════════════════
-- CUSTOM ORDER OPTIONS + BUDGET CURRENCY
--
-- 1. custom_order_options: admin-managed dropdown values for the /custom-order
--    form — Jewellery Types ('category') and Metal Preferences ('metal').
--    Admins add / edit / enable-disable / delete / reorder these from the
--    Custom Orders admin section. Kept SEPARATE from the product-side
--    metal_options / categories tables — this is custom-order-only.
--
-- 2. custom_orders.budget_currency + budget_amount: structured budget so the
--    customer can pick INR or USD and enter an amount (the legacy free-text
--    `budget` column stays for display/back-compat).
--
-- Idempotent. Run in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Options table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_order_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        VARCHAR(20) NOT NULL CHECK (type IN ('category', 'metal')),
  label       VARCHAR(120) NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No duplicate label within the same type.
CREATE UNIQUE INDEX IF NOT EXISTS uq_custom_order_options_type_label
  ON public.custom_order_options (type, lower(label));
CREATE INDEX IF NOT EXISTS idx_custom_order_options_type
  ON public.custom_order_options (type, position);

-- updated_at trigger (reuses shared fn; create it if missing).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $fn$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_custom_order_options_updated_at ON public.custom_order_options;
CREATE TRIGGER update_custom_order_options_updated_at
  BEFORE UPDATE ON public.custom_order_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2. Seed defaults (only when the table is empty) ─────────────────────────
INSERT INTO public.custom_order_options (type, label, position)
SELECT * FROM (VALUES
  ('category', 'Ring',      0),
  ('category', 'Necklace',  1),
  ('category', 'Pendant',   2),
  ('category', 'Earrings',  3),
  ('category', 'Bracelet',  4),
  ('category', 'Bangle',    5),
  ('category', 'Chain',     6),
  ('category', 'Nose Pin',  7),
  ('category', 'Anklet',    8),
  ('category', 'Other',     9),
  ('metal', 'Yellow Gold',  0),
  ('metal', 'White Gold',   1),
  ('metal', 'Rose Gold',    2),
  ('metal', 'Platinum',     3),
  ('metal', 'Silver',       4),
  ('metal', 'Not sure',     5)
) AS seed(type, label, position)
WHERE NOT EXISTS (SELECT 1 FROM public.custom_order_options);

-- ── 3. RLS (service-role bypasses; lock down anon surface) ───────────────────
ALTER TABLE public.custom_order_options ENABLE ROW LEVEL SECURITY;

-- Anyone may read ENABLED options (the public form needs them). Writes go
-- through the service-role API only.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_order_options'
      AND policyname = 'Public can read enabled custom order options'
  ) THEN
    CREATE POLICY "Public can read enabled custom order options"
      ON public.custom_order_options
      FOR SELECT USING (is_enabled = TRUE);
  END IF;
END $$;

-- ── 4. Budget currency + amount on custom_orders ────────────────────────────
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS budget_currency VARCHAR(3);
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(14,2);

-- ════════════════════════════════════════════════════════════════════════════
-- Done. Tables: custom_order_options (+ custom_orders budget columns)
-- ════════════════════════════════════════════════════════════════════════════
