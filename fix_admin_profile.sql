-- Fix User Profile & Grant Admin Access
-- Copy/Paste this into Supabase SQL Editor

-- 1. Create the clients table if it doesn't exist (just in case)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  email text,
  first_name text,
  last_name text,
  role text DEFAULT 'user',
  mailing_list boolean DEFAULT false
);

-- 2. Insert or Update the user record to be an Admin
INSERT INTO public.clients (id, email, first_name, last_name, role)
SELECT 
  id, 
  email, 
  'David', -- You can change this
  'Kish', 
  'admin'  -- CRITICAL: This enables the Blog Tool
FROM auth.users
WHERE email = 'kishdav@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  email = EXCLUDED.email; -- Ensure email is synced

-- 3. Enable RLS (Security) so the app can actually read this data
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.clients;
CREATE POLICY "Users can view own profile"
  ON public.clients FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.clients;
CREATE POLICY "Users can update own profile"
  ON public.clients FOR UPDATE
  USING (auth.uid() = id);

-- 5. Verify the result
SELECT * FROM public.clients WHERE email = 'kishdav@gmail.com';
