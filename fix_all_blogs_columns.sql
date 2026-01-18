-- Fix all missing columns in blogs table
DO $$
BEGIN
    -- Add slug (Critical missing column)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'slug') THEN
        ALTER TABLE public.blogs ADD COLUMN slug text UNIQUE;
    END IF;

    -- Add title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'title') THEN
        ALTER TABLE public.blogs ADD COLUMN title text;
    END IF;

    -- Add content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'content') THEN
        ALTER TABLE public.blogs ADD COLUMN content text;
    END IF;

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
    
    -- Add status (if missing, though unlikely if table exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'status') THEN
        ALTER TABLE public.blogs ADD COLUMN status text DEFAULT 'draft';
    END IF;
    
    -- Add author_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'author_id') THEN
        ALTER TABLE public.blogs ADD COLUMN author_id uuid REFERENCES public.clients(id);
    END IF;

END $$;

-- Reload the schema cache is partly automatic, but sometimes explicit grant re-runs help refresh state
ALTER TABLE public.blogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
