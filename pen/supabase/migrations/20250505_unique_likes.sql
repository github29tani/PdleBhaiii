-- Create likes table with unique constraint
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, note_id)
);

-- Add RLS policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own likes
CREATE POLICY "Users can view their own likes"
  ON likes FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to add likes
CREATE POLICY "Users can add likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to remove their own likes
CREATE POLICY "Users can remove their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);
