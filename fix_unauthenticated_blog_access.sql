-- FINAL COMPREHENSIVE PUBLIC ACCESS FIX
-- This script ensures the Blog page works for everyone, including unauthenticated guests.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Ensure Table Level Access
--------------------------------------------------------------------------------
-- Grant schema access to anonymous users (just in case it was revoked)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.blogs TO anon;
GRANT SELECT ON public.blogs TO authenticated;
GRANT SELECT ON public.clients TO anon; -- For author names

--------------------------------------------------------------------------------
-- 2. Reset and Rebuild Blog Policies
--------------------------------------------------------------------------------
-- Disable/Enable RLS to clear potential stuck states
ALTER TABLE public.blogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible previous read policies to start clean
DROP POLICY IF EXISTS "Public blogs are viewable by everyone" ON blogs;
DROP POLICY IF EXISTS "Public can view published blogs" ON blogs;
DROP POLICY IF EXISTS "Public can read blogs" ON blogs;
DROP POLICY IF EXISTS "Enable read access for all users" ON blogs;
DROP POLICY IF EXISTS "Anyone can read blogs" ON blogs;

-- CREATE THE FINAL PUBLIC POLICY
-- This allows ANYONE to read blogs that are 'published'
CREATE POLICY "Allow public read for published blogs"
ON public.blogs
FOR SELECT
TO public
USING (status = 'published');

-- CREATE THE ADMIN OVERRIDE POLICY
-- This allows admins to see ALL blogs (even drafts)
DROP POLICY IF EXISTS "Admins can do everything with blogs" ON blogs;
CREATE POLICY "Admins can do everything with blogs"
ON public.blogs
FOR ALL
TO authenticated
USING (
  exists (
    select 1 from public.clients 
    where clients.id = auth.uid() 
    and clients.role = 'admin'
  )
);

--------------------------------------------------------------------------------
-- 3. Storage Permissions (Public Images)
--------------------------------------------------------------------------------
-- Ensure bucket is public and policies exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'blog-images');

--------------------------------------------------------------------------------
-- 4. Publication Safety Check
--------------------------------------------------------------------------------
-- If blogs are currently set to 'draft', they won't show up on the public page.
-- This command will publish all existing blogs that have content.
-- UPDATE blogs SET status = 'published' WHERE status = 'draft' AND content IS NOT NULL;

COMMIT;

-- Verify Policies
SELECT * FROM pg_policies WHERE tablename = 'blogs';
