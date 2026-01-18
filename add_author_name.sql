-- Add Author Name column to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS author_name TEXT;
