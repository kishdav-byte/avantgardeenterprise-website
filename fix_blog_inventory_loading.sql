-- Fix Blog Inventory Loading Issue
-- This script ensures admins can see all blogs in the dashboard
-- Run this in your Supabase SQL Editor

-- 1. Drop all existing blog policies
DROP POLICY IF EXISTS "Public blogs are viewable by everyone" ON blogs;
DROP POLICY IF EXISTS "Admins/Authors can manage blogs" ON blogs;
DROP POLICY IF EXISTS "Public can view published blogs" ON blogs;
DROP POLICY IF EXISTS "Public can read blogs" ON blogs;
DROP POLICY IF EXISTS "Enable read access for all users" ON blogs;
DROP POLICY IF EXISTS "Admins can do everything with blogs" ON blogs;
DROP POLICY IF EXISTS "Authors can manage their own blogs" ON blogs;

-- 2. Ensure RLS is enabled
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for public to view published blogs
CREATE POLICY "Public can view published blogs"
ON blogs
FOR SELECT
TO public
USING (status = 'published');

-- 4. Create policy for admins to do everything with ALL blogs
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

-- 5. Create policy for authors to manage their own blogs
CREATE POLICY "Authors can manage their own blogs"
ON blogs
FOR ALL
TO authenticated
USING (auth.uid() = author_id);

-- 6. Verify your admin status (check if you're an admin)
SELECT id, email, role FROM clients WHERE id = auth.uid();

-- 7. Check existing blogs
SELECT id, title, status, author_id, created_at FROM blogs ORDER BY created_at DESC LIMIT 10;
