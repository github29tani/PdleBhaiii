-- Enable storage for notes and thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Policy for viewing files (public access)
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
USING (
    bucket_id IN ('notes', 'thumbnails')
);

-- Policy for uploading files (authenticated users only)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('notes', 'thumbnails')
);

-- Policy for deleting files (only owner can delete)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Add thumbnail_url column to notes if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notes' 
                   AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.notes ADD COLUMN thumbnail_url TEXT;
    END IF;
END $$;
