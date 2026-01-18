-- COMPLETE FIX: Clients, Blogs, and Permissions
-- Run this ENTIRE script in Supabase SQL Editor to resolve dashboard spinning and blog errors.

-- ==========================================
-- 1. CLIENTS TABLE & RLS (Dashboard Spinner Fix)
-- ==========================================

-- 1A. Ensure the user exists and is an Admin
-- Replace 'kishdav@gmail.com' with your actual email if different
INSERT INTO public.clients (id, email, first_name, last_name, role)
SELECT 
  id, 
  email, 
  'David', 
  'Kish', 
  'admin' 
FROM auth.users
WHERE email = 'kishdav@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  email = EXCLUDED.email;

-- 1B. Reset Permissions for Clients (Nuclear Option)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop all existing constraints/policies to clear any conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.clients;
DROP POLICY IF EXISTS "Users can update own profile" ON public.clients;
DROP POLICY IF EXISTS "Enable all for users based on ID" ON public.clients;

-- Create one simple, permissive policy for the owner
CREATE POLICY "Enable all for users based on ID"
ON public.clients
FOR ALL 
USING (auth.uid() = id);

-- 1C. Grant table access to 'authenticated' role
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;


-- ==========================================
-- 2. BLOGS TABLE COLUMNS (Schema Logic)
-- ==========================================
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
    -- Add status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'status') THEN
        ALTER TABLE public.blogs ADD COLUMN status text DEFAULT 'draft';
    END IF;
    -- Add author_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'author_id') THEN
        ALTER TABLE public.blogs ADD COLUMN author_id uuid REFERENCES public.clients(id);
    END IF;
    -- Add published_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'published_at') THEN
        ALTER TABLE public.blogs ADD COLUMN published_at timestamptz;
    END IF;
    -- Add created_at (should exist, but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'created_at') THEN
        ALTER TABLE public.blogs ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;


-- ==========================================
-- 3. BLOGS RLS POLICIES (Fix Timeout/Access)
-- ==========================================
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Clear old policies
DROP POLICY IF EXISTS "Public can view published blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can do everything" ON public.blogs;
DROP POLICY IF EXISTS "Users can view all blogs" ON public.blogs;

-- Policy 1: Everyone can read 'published' blogs
CREATE POLICY "Public can view published blogs"
ON public.blogs
FOR SELECT
USING (status = 'published');

-- Policy 2: Admins (as defined in clients table) can do everything
-- This subquery relies on the user being able to read their own client row (fixed in Step 1)
CREATE POLICY "Admins can do everything"
ON public.blogs
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM public.clients WHERE role = 'admin')
);

-- Grant access
GRANT ALL ON TABLE public.blogs TO authenticated;
GRANT ALL ON TABLE public.blogs TO anon;
GRANT ALL ON TABLE public.blogs TO service_role;

-- Final Verification
SELECT id, email, role FROM public.clients WHERE email = 'kishdav@gmail.com';
