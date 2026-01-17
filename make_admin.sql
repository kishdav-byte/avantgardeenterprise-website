-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- This will promote the user to administrator

-- Update the user role in the clients table
UPDATE public.clients
SET role = 'admin'
WHERE email = 'kishdav@gmail.com';

-- Verify the update
SELECT * FROM public.clients WHERE email = 'kishdav@gmail.com';
