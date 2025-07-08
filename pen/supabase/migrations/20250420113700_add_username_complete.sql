-- Step 1: Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN username text;

-- Step 2: Create function to generate username
CREATE OR REPLACE FUNCTION generate_username(name text)
RETURNS text AS $$
DECLARE
  base_username text;
  test_username text;
  counter integer := 0;
BEGIN
  -- Convert name to lowercase and replace spaces with underscores
  base_username := lower(regexp_replace(name, '\s+', '_', 'g'));
  
  -- Remove any special characters
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  
  -- If base_username is too short, pad it with 'user'
  IF length(base_username) < 4 THEN
    base_username := base_username || 'user';
  END IF;
  
  -- Initial try with just the padded name
  test_username := base_username;
  
  -- Keep trying with incrementing numbers until we find a unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = test_username) LOOP
    counter := counter + 1;
    test_username := base_username || counter::text;
  END LOOP;
  
  RETURN test_username;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Generate initial usernames for all users
UPDATE public.profiles
SET username = generate_username(name)
WHERE username IS NULL;

-- Step 4: Add constraints after data is fixed
ALTER TABLE public.profiles
ALTER COLUMN username SET NOT NULL,
ADD CONSTRAINT username_unique UNIQUE (username),
ADD CONSTRAINT username_length CHECK (length(username) >= 4),
ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]+$');
