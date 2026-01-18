-- FIX: Insert Client with Required Name Fields
INSERT INTO public.clients (id, email, first_name, last_name, role)
SELECT 
  id, 
  email, 
  'David', 
  'Kish', 
  'admin'
FROM auth.users
WHERE email = 'kishdav@gmail.com'  -- Ensure this matches your login email!
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'admin',
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Verify
SELECT * FROM public.clients WHERE email = 'kishdav@gmail.com';
