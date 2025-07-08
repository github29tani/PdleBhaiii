-- Add languages column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{"english"}';

-- Add language column to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'english';

-- Create RLS policies for profiles table
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
