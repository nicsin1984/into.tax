-- Add new columns to spotlight table for enhanced profiles
ALTER TABLE spotlight ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE spotlight ADD COLUMN IF NOT EXISTS specialism TEXT;
ALTER TABLE spotlight ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
