-- Drop existing select policy
DROP POLICY IF EXISTS "career_posts_select" ON public.career_posts;

-- Create a more permissive select policy for testing
CREATE POLICY "career_posts_select"
  ON public.career_posts
  FOR SELECT
  TO authenticated
  USING (true);  -- Allow all authenticated users to view posts

-- Add a comment to explain this is temporary
COMMENT ON POLICY "career_posts_select" ON public.career_posts
  IS 'Temporary policy to allow all authenticated users to view posts';
