-- Compliance Breach weekly briefing table
-- Run this once in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.compliance_breach (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id          UUID REFERENCES public.articles(id),
  draft_text          TEXT,
  source_text         TEXT,
  verification_text   TEXT,
  verification_status TEXT CHECK (verification_status IN ('verified', 'needs_review', 'failed')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at         TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  week_number         INTEGER NOT NULL,
  year                INTEGER NOT NULL,
  secret_token        TEXT NOT NULL
);

-- Only one draft/approved entry per week
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_breach_week
  ON public.compliance_breach (week_number, year)
  WHERE status IN ('draft', 'approved', 'published');

CREATE INDEX IF NOT EXISTS idx_compliance_breach_status
  ON public.compliance_breach (status);

-- Enable RLS
ALTER TABLE public.compliance_breach ENABLE ROW LEVEL SECURITY;

-- No public read — internal only (API routes use service role key)
-- Service role key bypasses RLS automatically
