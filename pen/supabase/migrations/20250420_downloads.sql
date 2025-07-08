-- Create downloads table for tracking user downloads
CREATE TABLE public.downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    note_id UUID REFERENCES public.notes(id) NOT NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, note_id)
);

-- Enable RLS
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Add indexes for better query performance
CREATE INDEX downloads_user_id_idx ON public.downloads(user_id);
CREATE INDEX downloads_note_id_idx ON public.downloads(note_id);
CREATE INDEX downloads_downloaded_at_idx ON public.downloads(downloaded_at);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.downloads;
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.downloads;
DROP POLICY IF EXISTS "Users can delete their own downloads" ON public.downloads;

-- Policy for inserting downloads
CREATE POLICY "Users can insert their own downloads"
ON public.downloads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for viewing downloads
CREATE POLICY "Users can view their own downloads"
ON public.downloads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Function to record a download
CREATE OR REPLACE FUNCTION public.record_download(
    p_note_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_download_id UUID;
BEGIN
    -- Insert into downloads
    INSERT INTO public.downloads (
        user_id,
        note_id
    ) VALUES (
        auth.uid(),
        p_note_id
    )
    ON CONFLICT (user_id, note_id) DO UPDATE
    SET downloaded_at = NOW()
    RETURNING id INTO v_download_id;

    RETURN v_download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
