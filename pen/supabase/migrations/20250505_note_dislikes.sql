-- Create dislikes table with unique constraint
CREATE TABLE IF NOT EXISTS dislikes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, note_id)
);

-- Add RLS policies
ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view dislikes" ON dislikes;
DROP POLICY IF EXISTS "Users can add dislikes" ON dislikes;
DROP POLICY IF EXISTS "Users can remove their own dislikes" ON dislikes;

-- Allow all users to view dislikes
CREATE POLICY "Anyone can view dislikes"
  ON dislikes FOR SELECT
  USING (true);

-- Allow users to add dislikes
CREATE POLICY "Users can add dislikes"
  ON dislikes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to remove their own dislikes
CREATE POLICY "Users can remove their own dislikes"
  ON dislikes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_dislikes_note_id ON dislikes(note_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_user_id ON dislikes(user_id);
