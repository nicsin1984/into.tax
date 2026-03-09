-- Create spotlight table for "In the Spotlight" feature
CREATE TABLE IF NOT EXISTS spotlight (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  firm TEXT NOT NULL,
  paragraph TEXT NOT NULL,
  issue_date DATE NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE spotlight ENABLE ROW LEVEL SECURITY;

-- Allow public read access for published entries
CREATE POLICY "Allow public read" ON spotlight
  FOR SELECT
  TO anon
  USING (published = true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_spotlight_issue_date ON spotlight(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_spotlight_published ON spotlight(published);
