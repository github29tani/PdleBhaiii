-- Add columns to profiles table for social links
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS qualifications TEXT[],
ADD COLUMN IF NOT EXISTS experience TEXT[];

-- Create a table for user qualifications
CREATE TABLE IF NOT EXISTS public.user_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    qualification TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for user experience
CREATE TABLE IF NOT EXISTS public.user_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    experience TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_qualifications_user_id ON public.user_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experience_user_id ON public.user_experience(user_id);

-- Add RLS policies for qualifications
ALTER TABLE public.user_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own qualifications"
    ON public.user_qualifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own qualifications"
    ON public.user_qualifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own qualifications"
    ON public.user_qualifications
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own qualifications"
    ON public.user_qualifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add RLS policies for experience
ALTER TABLE public.user_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own experience"
    ON public.user_experience
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experience"
    ON public.user_experience
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience"
    ON public.user_experience
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experience"
    ON public.user_experience
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update timestamps
CREATE TRIGGER update_user_qualifications_modtime
BEFORE UPDATE ON public.user_qualifications
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_experience_modtime
BEFORE UPDATE ON public.user_experience
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add comments for documentation
COMMENT ON TABLE public.user_qualifications IS 'Stores user qualifications with timestamps';
COMMENT ON TABLE public.user_experience IS 'Stores user work/educational experience with timestamps';
COMMENT ON COLUMN public.profiles.twitter_url IS 'User''s Twitter profile URL';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'User''s LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.instagram_url IS 'User''s Instagram profile URL';
COMMENT ON COLUMN public.profiles.github_url IS 'User''s GitHub profile URL';
COMMENT ON COLUMN public.profiles.website_url IS 'User''s personal website URL';

-- Grant necessary permissions
GRANT ALL ON public.user_qualifications TO authenticated, service_role;
GRANT ALL ON public.user_experience TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
