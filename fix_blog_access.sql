-- 1. Ensure Columns Exist (in case you missed previous scripts)
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS seo_critique TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS author_name TEXT;

-- 2. RESET and OPEN RLS for Reading
-- This ensures ANYONE can view blogs (we filter for 'published' in the app)
DROP POLICY IF EXISTS "Allow Public Read via Published" ON public.blogs;
DROP POLICY IF EXISTS "Public Read" ON public.blogs;

CREATE POLICY "Public Read" 
ON public.blogs 
FOR SELECT 
TO public, anon, authenticated, service_role 
USING (true);

-- 3. Ensure Admins have full access
CREATE POLICY "Admin Full Access" 
ON public.blogs 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
