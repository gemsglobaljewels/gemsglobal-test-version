-- Allow ledger net_weight to hold free-form text as well as numbers.
-- Numeric net weights still drive the fine-weight auto-calc (parsed on read);
-- non-numeric text is treated as 0 there, exactly like a blank entry, so
-- widening the column type has no effect on existing computed values.
-- Existing numeric values cast automatically to their text representation.

ALTER TABLE ledger_entries
  ALTER COLUMN net_weight TYPE text USING net_weight::text;
