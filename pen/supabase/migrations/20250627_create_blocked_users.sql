-- Create blocked_users table
CREATE TABLE public.blocked_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Add RLS policies
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own blocked users
CREATE POLICY "Users can view their own blocked users" ON public.blocked_users
    FOR SELECT
    USING (auth.uid() = blocker_id);

-- Policy to allow users to block/unblock users
CREATE POLICY "Users can block/unblock users" ON public.blocked_users
    FOR ALL
    USING (auth.uid() = blocker_id)
    WITH CHECK (auth.uid() = blocker_id);
