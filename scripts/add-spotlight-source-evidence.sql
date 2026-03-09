-- Add source_evidence column to spotlight table
ALTER TABLE spotlight ADD COLUMN IF NOT EXISTS source_evidence TEXT;
