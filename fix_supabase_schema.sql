-- Force add missing columns to the blogs table
-- Run this in Supabase SQL Editor

ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS status text default 'draft' check (status in ('draft', 'published', 'scheduled', 'archived')),
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS seo_keywords text[],
ADD COLUMN IF NOT EXISTS intent text,
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS generated_social_snippets jsonb;

-- Re-run the policy creation (safe to run again if it failed before)
DROP POLICY IF EXISTS "Public blogs are viewable by everyone" ON public.blogs;
CREATE POLICY "Public blogs are viewable by everyone"
  ON public.blogs FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins/Authors can manage blogs" ON public.blogs;
CREATE POLICY "Admins/Authors can manage blogs"
  ON public.blogs FOR ALL
  USING (auth.uid() = author_id);
