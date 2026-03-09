-- Add confirmation_token column and active column to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS confirmation_token UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;

-- Create index on confirmation_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmation_token 
ON public.subscribers(confirmation_token) 
WHERE confirmation_token IS NOT NULL;
