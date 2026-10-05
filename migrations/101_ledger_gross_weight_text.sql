-- Allow ledger gross_weight to hold free-form text as well as numbers.
-- gross_weight is display-only (never used in any computation), so widening
-- the column type has no effect on fine weight / metal price / totals.
-- Existing numeric values cast automatically to their text representation.

ALTER TABLE ledger_entries
  ALTER COLUMN gross_weight TYPE text USING gross_weight::text;
