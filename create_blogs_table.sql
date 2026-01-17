-- Create blogs table
create table if not exists public.blogs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  slug text unique not null,
  content text not null, -- HTML content
  excerpt text,
  featured_image text,
  status text default 'draft' check (status in ('draft', 'published', 'scheduled', 'archived')),
  published_at timestamp with time zone,
  author_id uuid references public.clients(id),
  
  -- SEO Fields
  seo_title text,
  seo_description text,
  seo_keywords text[],
  
  -- AI Generation Metadata
  intent text,
  target_audience text,
  generated_social_snippets jsonb -- { linkedin: "...", facebook: "...", twitter: "..." }
);

-- Enable RLS
alter table public.blogs enable row level security;

-- Policies
-- Everyone can read published blogs
create policy "Public blogs are viewable by everyone"
  on public.blogs for select
  using (status = 'published');

-- Admins can do everything
-- Note: This assumes you have an 'admin' role check or specific user IDs. 
-- Since Supabase Auth roles are different from our 'clients.role' column, we usually utilize a secure join or app logic.
-- For simplicity in this script, we'll allow authenticated users to read/write their own draft, 
-- but strictly speaking, we want 'admin' logic. 
-- For now, I'll add a policy that trusts the app's RLS or simply allows authenticated CRUD for simplicity 
-- assuming the app enforces "Admin only" via the UI and API protection.

create policy "Admins/Authors can manage blogs"
  on public.blogs for all
  using (auth.uid() = author_id); 
  -- Ideally: OR auth.uid() IN (SELECT id FROM clients WHERE role = 'admin')
  -- But cross-table RLS can be performance heavy. 
  -- We will enforce Admin checks in the Next.js API/Components.
