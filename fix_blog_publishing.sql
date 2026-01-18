-- FIX BLOG PERMISSIONS for Publishing and Managing

-- 1. Grant table access to roles
GRANT ALL ON TABLE public.blogs TO authenticated;
GRANT ALL ON TABLE public.blogs TO service_role;

-- 2. Drop restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Admins/Authors can manage blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can manage all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can manage their own blogs" ON public.blogs;

-- 3. Create comprehensive policies

-- A. Public Read Access (Published only)
-- (Already exists as "Public blogs are viewable by everyone" usually, but let's ensure it)
DROP POLICY IF EXISTS "Public blogs are viewable by everyone" ON public.blogs;
CREATE POLICY "Public blogs are viewable by everyone"
ON public.blogs FOR SELECT
USING (status = 'published');

-- B. Author Access (CRUD their own)
CREATE POLICY "Authors can manage their own blogs"
ON public.blogs FOR ALL
USING (auth.uid() = author_id);

-- C. Admin Access (CRUD ALL)
CREATE POLICY "Admins can manage all blogs"
ON public.blogs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = auth.uid()
    AND clients.role = 'admin'
  )
);
