-- Add missing columns to blogs table if they don't exist
DO $$
BEGIN
    -- Add excerpt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'excerpt') THEN
        ALTER TABLE public.blogs ADD COLUMN excerpt text;
    END IF;

    -- Add featured_image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'featured_image') THEN
        ALTER TABLE public.blogs ADD COLUMN featured_image text;
    END IF;

    -- Add generated_social_snippets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'generated_social_snippets') THEN
        ALTER TABLE public.blogs ADD COLUMN generated_social_snippets jsonb;
    END IF;

    -- Add intent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'intent') THEN
        ALTER TABLE public.blogs ADD COLUMN intent text;
    END IF;

    -- Add seo_keywords
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'seo_keywords') THEN
        ALTER TABLE public.blogs ADD COLUMN seo_keywords text[];
    END IF;
    
    -- Add seo_title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'seo_title') THEN
        ALTER TABLE public.blogs ADD COLUMN seo_title text;
    END IF;

    -- Add seo_description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'seo_description') THEN
        ALTER TABLE public.blogs ADD COLUMN seo_description text;
    END IF;

    -- Add target_audience
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'target_audience') THEN
        ALTER TABLE public.blogs ADD COLUMN target_audience text;
    END IF;

END $$;

-- Verify RLS is enabled
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Re-apply or ensure policies exist (Supabase allows multiple policies, but we can drop and recreate to be safe and clean)
DROP POLICY IF EXISTS "Public blogs are viewable by everyone" ON public.blogs;
CREATE POLICY "Public blogs are viewable by everyone"
  ON public.blogs FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins/Authors can manage blogs" ON public.blogs;
CREATE POLICY "Admins/Authors can manage blogs"
  ON public.blogs FOR ALL
  USING (auth.uid() = author_id);
