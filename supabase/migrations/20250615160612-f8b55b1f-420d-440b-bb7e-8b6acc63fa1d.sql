
-- Create usage_stats table for per-user, per-month usage tracking

CREATE TABLE IF NOT EXISTS public.usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year_month TEXT NOT NULL, -- format: 'YYYY-MM'
  proposal_count INT NOT NULL DEFAULT 0,
  followup_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, year_month)
);

-- Optional: Add foreign key to users/profiles
-- (Uncomment the next line if user_id needs enforced FK to user_profiles)
-- ALTER TABLE public.usage_stats
--   ADD CONSTRAINT usage_stats_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS) for privacy
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select and manage only their own stats
CREATE POLICY "User can read their usage_stats" ON public.usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own usage_stats" ON public.usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own usage_stats" ON public.usage_stats
  FOR UPDATE USING (auth.uid() = user_id);

