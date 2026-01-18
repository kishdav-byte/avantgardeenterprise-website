-- Add SEO Score column to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS seo_critique TEXT;
