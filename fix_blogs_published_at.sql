-- Fix final missing columns in blogs table
DO $$
BEGIN
    -- Add published_at (Critical missing column from error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'published_at') THEN
        ALTER TABLE public.blogs ADD COLUMN published_at timestamp with time zone;
    END IF;

    -- Add updated_at (Good practice if also missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'updated_at') THEN
        ALTER TABLE public.blogs ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
    END IF;

END $$;

-- Toggle RLS to refresh schema
ALTER TABLE public.blogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
