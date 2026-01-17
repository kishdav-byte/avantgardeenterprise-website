-- Fix Role Constraint and Update Profile
-- Run this in Supabase SQL Editor

-- 1. Remove the restrictive check constraint on 'role'
-- This allows us to set values like 'admin', 'editor', etc. without error
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_role_check;

-- Optional: Re-add a more flexible constraint if you want strict validation
-- ALTER TABLE public.clients ADD CONSTRAINT clients_role_check CHECK (role IN ('user', 'admin', 'editor'));

-- 2. Insert or Update the user record to be an Admin
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
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- 3. Verify the result
SELECT * FROM public.clients WHERE email = 'kishdav@gmail.com';
