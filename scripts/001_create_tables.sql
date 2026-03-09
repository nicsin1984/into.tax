-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  category TEXT NOT NULL DEFAULT 'Personal Tax',
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'standard',
  view_count INTEGER DEFAULT 0,
  is_lead BOOLEAN DEFAULT false,
  cluster_id UUID,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Key dates table for HMRC deadlines
CREATE TABLE IF NOT EXISTS public.key_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "articles_public_read" ON public.articles;
DROP POLICY IF EXISTS "key_dates_public_read" ON public.key_dates;
DROP POLICY IF EXISTS "subscribers_insert" ON public.subscribers;

-- Public read policies
CREATE POLICY "articles_public_read" ON public.articles FOR SELECT USING (true);
CREATE POLICY "key_dates_public_read" ON public.key_dates FOR SELECT USING (true);
CREATE POLICY "subscribers_insert" ON public.subscribers FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_is_lead ON public.articles (is_lead);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_cluster_id ON public.articles (cluster_id);
CREATE INDEX IF NOT EXISTS idx_key_dates_deadline ON public.key_dates (deadline_date ASC);
