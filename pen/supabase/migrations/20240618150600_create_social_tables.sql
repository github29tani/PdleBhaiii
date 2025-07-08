-- First, create enum types if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_type') THEN
    CREATE TYPE group_type AS ENUM ('public', 'private', 'invite-only');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved');
  END IF;
END
$$;

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type group_type NOT NULL DEFAULT 'public',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT
);

-- Group Members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id),
  CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Group Messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL,
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- User Reports table
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  CONSTRAINT fk_reporter FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reported FOREIGN KEY (reported_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_resolved_by FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Ensure the reported_id column exists (for cases where the table exists but column is missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_reports' 
    AND column_name = 'reported_id'
  ) THEN
    ALTER TABLE public.user_reports
    ADD COLUMN reported_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Update any existing rows if needed
    -- UPDATE public.user_reports SET reported_id = NULL WHERE reported_id IS NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_user_id ON public.group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_id ON public.user_reports(reported_id);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for groups
CREATE POLICY "Enable read access for all users" ON public.groups
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for group admins" ON public.groups
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Create RLS policies for group members
CREATE POLICY "Enable read access for group members" ON public.group_members
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users with invite" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      (SELECT type FROM public.groups WHERE id = group_id) = 'public' OR
      auth.uid() = (SELECT created_by FROM public.groups WHERE id = group_id) OR
      EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = group_members.group_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
      )
    )
  );

-- Create RLS policies for user reports
CREATE POLICY "Enable read for admins" ON public.user_reports
  FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = reporter_id);

CREATE POLICY "Enable insert for authenticated users" ON public.user_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for admins" ON public.user_reports
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create a view for group member counts
CREATE OR REPLACE VIEW public.group_member_counts AS
  SELECT 
    g.id as group_id,
    g.name as group_name,
    COUNT(gm.id) as member_count
  FROM public.groups g
  LEFT JOIN public.group_members gm ON g.id = gm.group_id
  GROUP BY g.id, g.name;

-- Create a function to get user's groups
CREATE OR REPLACE FUNCTION public.get_user_groups(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  type group_type,
  member_count BIGINT,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.description,
    g.type,
    (SELECT COUNT(*) FROM public.group_members WHERE group_id = g.id)::BIGINT as member_count,
    gm.role,
    g.created_at
  FROM public.groups g
  JOIN public.group_members gm ON g.id = gm.group_id
  WHERE gm.user_id = user_id
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get group members with roles
CREATE OR REPLACE FUNCTION public.get_group_members(group_id_param UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  role TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    p.username,
    p.avatar_url,
    gm.role,
    gm.joined_at
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  JOIN public.group_members gm ON u.id = gm.user_id
  WHERE gm.group_id = group_id_param
  ORDER BY 
    CASE gm.role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      ELSE 3
    END,
    gm.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to report a user
CREATE OR REPLACE FUNCTION public.report_user(
  reporter_id UUID,
  reported_id UUID,
  reason TEXT
) RETURNS UUID AS $$
DECLARE
  report_id UUID;
BEGIN
  INSERT INTO public.user_reports (reporter_id, reported_id, reason)
  VALUES (reporter_id, reported_id, reason)
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle report resolution
CREATE OR REPLACE FUNCTION public.resolve_report(
  p_report_id UUID,
  p_resolver_id UUID,
  p_action TEXT,
  p_resolution_text TEXT
) RETURNS VOID AS $$
DECLARE
  v_reported_id UUID;
  v_report_exists BOOLEAN;
BEGIN
  -- First verify the report exists and get the reported_id
  SELECT TRUE, ur.reported_id 
  INTO v_report_exists, v_reported_id 
  FROM public.user_reports ur
  WHERE ur.id = p_report_id
  LIMIT 1;

  -- If report doesn't exist, raise an exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report with ID % not found', p_report_id;
  END IF;
  
  -- Update the report
  UPDATE public.user_reports
  SET 
    status = 'resolved',
    resolved_by = p_resolver_id,
    resolved_at = NOW(),
    resolution = p_resolution_text,
    updated_at = NOW()
  WHERE id = p_report_id;
  
  -- Take action based on the action parameter
  IF p_action = 'ban' AND v_reported_id IS NOT NULL THEN
    -- Since profiles table doesn't have is_banned column, we'll just update the user status
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{is_banned}', 'true'::jsonb)
    WHERE id = v_reported_id;
    
    -- Also update the profile if it exists
    UPDATE public.profiles 
    SET updated_at = NOW()
    WHERE id = v_reported_id;
    
  ELSIF p_action = 'warn' AND v_reported_id IS NOT NULL THEN
    -- You can add warning logic here
    -- For example, increment a warning count in the profile
    UPDATE public.profiles 
    SET updated_at = NOW()
    WHERE id = v_reported_id;
  END IF;
  
  -- Here you could add notification logic
  -- e.g., notify the reported user about the action taken
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE EXCEPTION 'Error in resolve_report(%): %', p_report_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
