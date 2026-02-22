ALTER TABLE public.k9_dogs ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('k9-images', 'k9-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own dog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'k9-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own dog images"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (
    bucket_id = 'k9-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view dog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'k9-images');
