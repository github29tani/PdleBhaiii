-- Create a function to update profile with qualifications and experience
CREATE OR REPLACE FUNCTION public.update_profile_with_qualifications(
  p_user_id UUID,
  p_name TEXT,
  p_bio TEXT,
  p_twitter_url TEXT,
  p_linkedin_url TEXT,
  p_instagram_url TEXT,
  p_github_url TEXT,
  p_website_url TEXT,
  p_qualifications TEXT[],
  p_experience TEXT[]
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update the main profile
  UPDATE public.profiles
  SET 
    name = p_name,
    bio = p_bio,
    twitter_url = p_twitter_url,
    linkedin_url = p_linkedin_url,
    instagram_url = p_instagram_url,
    github_url = p_github_url,
    website_url = p_website_url,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Delete existing qualifications
  DELETE FROM public.user_qualifications
  WHERE user_id = p_user_id;
  
  -- Insert new qualifications
  IF p_qualifications IS NOT NULL AND array_length(p_qualifications, 1) > 0 THEN
    INSERT INTO public.user_qualifications (user_id, qualification)
    SELECT p_user_id, unnest(p_qualifications);
  END IF;
  
  -- Delete existing experience
  DELETE FROM public.user_experience
  WHERE user_id = p_user_id;
  
  -- Insert new experience
  IF p_experience IS NOT NULL AND array_length(p_experience, 1) > 0 THEN
    INSERT INTO public.user_experience (user_id, experience)
    SELECT p_user_id, unnest(p_experience);
  END IF;
  
  -- Return success
  RETURN jsonb_build_object('status', 'success', 'message', 'Profile updated successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_profile_with_qualifications TO authenticated;
