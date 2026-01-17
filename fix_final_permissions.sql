-- FINAL FIX: Permissions, Data, and Access
-- Run this entire script in Supabase SQL Editor

-- 1. Ensure the user exists and is an Admin
INSERT INTO public.clients (id, email, first_name, last_name, role)
SELECT 
  id, 
  email, 
  'David', 
  'Kish', 
  'admin' -- Ensure this is set!
FROM auth.users
WHERE email = 'kishdav@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  email = EXCLUDED.email;

-- 2. Reset Permissions (Nuclear Option)
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

-- 3. Grant table access to 'authenticated' role (often overlooked)
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;

-- 4. Verify Immediate Result
SELECT * FROM public.clients WHERE email = 'kishdav@gmail.com';
