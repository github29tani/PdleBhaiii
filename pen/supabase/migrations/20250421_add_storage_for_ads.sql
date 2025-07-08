-- Create a bucket specifically for ads
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the ads bucket
DROP POLICY IF EXISTS "Public Access for Ad Images" ON storage.objects;
CREATE POLICY "Public Access for Ad Images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ads');

DROP POLICY IF EXISTS "Admin Insert Ad Images" ON storage.objects;
CREATE POLICY "Admin Insert Ad Images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'ads'
    AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin Delete Ad Images" ON storage.objects;
CREATE POLICY "Admin Delete Ad Images"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'ads'
    AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);
