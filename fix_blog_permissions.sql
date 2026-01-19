-- Ensure Public Read Access for Blogs
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on blogs (if not already)
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Public Read (Select)
-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Public can view published blogs" ON blogs;
DROP POLICY IF EXISTS "Public can read blogs" ON blogs;
DROP POLICY IF EXISTS "Enable read access for all users" ON blogs;

CREATE POLICY "Public can view published blogs"
ON blogs
FOR SELECT
TO public
USING (status = 'published');

-- 3. Verify Admins can still do everything
DROP POLICY IF EXISTS "Admins can do everything with blogs" ON blogs;
CREATE POLICY "Admins can do everything with blogs"
ON blogs
FOR ALL
TO authenticated
USING (
  exists (
    select 1 from clients 
    where clients.id = auth.uid() 
    and clients.role = 'admin'
  )
);
