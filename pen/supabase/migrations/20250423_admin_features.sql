-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS admin_role_assignments CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS ad_settings CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS telegram_groups CASCADE;
DROP TABLE IF EXISTS content_reports CASCADE;
DROP TABLE IF EXISTS ad_impressions CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS notes CASCADE;

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    class TEXT NOT NULL,
    board TEXT,
    topic TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    uploader_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    ad_clicks INTEGER DEFAULT 0,
    earnings NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON notes
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON notes
FOR INSERT
WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Enable update for note owners"
ON notes
FOR UPDATE
USING (auth.uid() = uploader_id)
WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Enable delete for note owners"
ON notes
FOR DELETE
USING (auth.uid() = uploader_id);

-- Create storage bucket for notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Give users access to own folder 1wywd9c_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1wywd9c_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1wywd9c_2" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to files 1wywd9c_3" ON storage.objects;

-- Set up storage policies
CREATE POLICY "Give users access to own folder 1wywd9c_0"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give users access to own folder 1wywd9c_1"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give users access to own folder 1wywd9c_2"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give public access to files 1wywd9c_3"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'notes');

-- Admin Roles and Permissions
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT admin_roles_name_key UNIQUE (name)
);

CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT admin_role_assignments_role_user_key UNIQUE (role_id, user_id)
);

-- App Settings
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    category VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Ad Settings
CREATE TABLE ad_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network VARCHAR(50) NOT NULL,
    ad_type VARCHAR(50) NOT NULL,
    ad_unit_id VARCHAR(255),
    enabled BOOLEAN DEFAULT true,
    frequency INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(50),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    device_info JSONB
);

-- Telegram Groups
CREATE TABLE telegram_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    link VARCHAR(255) NOT NULL,
    description TEXT,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for telegram_groups
ALTER TABLE telegram_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable admin access to telegram_groups" ON telegram_groups;

-- Create stored procedure for inserting telegram groups
CREATE OR REPLACE FUNCTION insert_telegram_group(
    p_name TEXT,
    p_link TEXT,
    p_description TEXT DEFAULT '',
    p_member_count INT DEFAULT 0
) RETURNS SETOF telegram_groups
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO telegram_groups (name, link, description, member_count)
    VALUES (p_name, p_link, p_description, p_member_count)
    RETURNING *;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION insert_telegram_group TO public;

-- Create policy for admin access to telegram_groups
CREATE POLICY "Enable admin access to telegram_groups"
ON telegram_groups
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_telegram_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_groups_updated_at
    BEFORE UPDATE ON telegram_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_groups_updated_at();

-- Analytics Tables
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    ad_id UUID NOT NULL,
    ad_unit_id VARCHAR(255) NOT NULL,
    impression_type VARCHAR(50) NOT NULL,
    note_id UUID REFERENCES notes(id),
    revenue NUMERIC(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    amount NUMERIC(10,2) NOT NULL,
    source VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable admin access to ad_impressions"
ON ad_impressions
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable admin access to earnings"
ON earnings
FOR ALL
USING (true)
WITH CHECK (true);

-- Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    content_title TEXT NOT NULL,
    reason TEXT NOT NULL,
    reporter_id UUID NOT NULL,
    resolved_by UUID,
    status TEXT NOT NULL DEFAULT 'pending',
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'resolved', 'dismissed'))
);

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for content_reports
DROP POLICY IF EXISTS "Enable admin access to content_reports" ON content_reports;
CREATE POLICY "Enable admin access to content_reports"
ON content_reports
FOR ALL
USING (true)
WITH CHECK (true);

-- Create stored procedure for managing reports
CREATE OR REPLACE FUNCTION manage_content_report(
    p_report_id UUID,
    p_status TEXT,
    p_resolution_note TEXT DEFAULT NULL,
    p_resolver_id UUID DEFAULT NULL
) RETURNS SETOF content_reports
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE content_reports
    SET 
        status = p_status,
        resolution_note = COALESCE(p_resolution_note, resolution_note),
        resolved_by = COALESCE(p_resolver_id, resolved_by),
        updated_at = NOW()
    WHERE id = p_report_id
    RETURNING *;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION manage_content_report TO public;

-- Drop existing analytics functions
DROP FUNCTION IF EXISTS get_monthly_user_growth();
DROP FUNCTION IF EXISTS get_monthly_note_uploads();
DROP FUNCTION IF EXISTS get_monthly_ad_views();
DROP FUNCTION IF EXISTS get_monthly_earnings();
DROP FUNCTION IF EXISTS get_top_subjects();

-- Analytics Functions

-- Get monthly user growth
CREATE OR REPLACE FUNCTION get_monthly_user_growth()
RETURNS TABLE (month_count bigint)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)
    FROM profiles
    WHERE created_at >= date_trunc('month', current_date - interval '5 months')
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
    LIMIT 6;
END;
$$;

-- Get monthly note uploads
CREATE OR REPLACE FUNCTION get_monthly_note_uploads()
RETURNS TABLE (month_count bigint)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)
    FROM notes
    WHERE created_at >= date_trunc('month', current_date - interval '5 months')
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
    LIMIT 6;
END;
$$;

-- Get monthly ad views
CREATE OR REPLACE FUNCTION get_monthly_ad_views()
RETURNS TABLE (month_count bigint)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)
    FROM ad_impressions
    WHERE created_at >= date_trunc('month', current_date - interval '5 months')
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
    LIMIT 6;
END;
$$;

-- Get monthly earnings
CREATE OR REPLACE FUNCTION get_monthly_earnings()
RETURNS TABLE (month_earnings numeric)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(amount), 0)
    FROM earnings
    WHERE created_at >= date_trunc('month', current_date - interval '5 months')
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
    LIMIT 6;
END;
$$;

-- Get top subjects
CREATE OR REPLACE FUNCTION get_top_subjects()
RETURNS TABLE (subject text, count bigint)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT n.subject, COUNT(*) as count
    FROM notes n
    GROUP BY n.subject
    ORDER BY count DESC
    LIMIT 5;
END;
$$;

-- Record ad impression function
CREATE OR REPLACE FUNCTION record_ad_impression(
    p_ad_id UUID,
    p_ad_unit_id TEXT,
    p_impression_type TEXT,
    p_note_id UUID DEFAULT NULL,
    p_revenue NUMERIC DEFAULT 0
)
RETURNS SETOF ad_impressions
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO ad_impressions (
        user_id,
        ad_id,
        ad_unit_id,
        impression_type,
        note_id,
        revenue
    )
    VALUES (
        auth.uid(),
        p_ad_id,
        p_ad_unit_id,
        p_impression_type,
        p_note_id,
        p_revenue
    )
    RETURNING *;

    -- Update note earnings if applicable
    IF p_note_id IS NOT NULL AND p_revenue > 0 THEN
        UPDATE notes
        SET earnings = earnings + p_revenue
        WHERE id = p_note_id;
    END IF;
END;
$$;

-- Grant execute permissions for analytics functions
GRANT EXECUTE ON FUNCTION get_monthly_user_growth TO public;
GRANT EXECUTE ON FUNCTION get_monthly_note_uploads TO public;
GRANT EXECUTE ON FUNCTION get_monthly_ad_views TO public;
GRANT EXECUTE ON FUNCTION get_monthly_earnings TO public;
GRANT EXECUTE ON FUNCTION get_top_subjects TO public;
GRANT EXECUTE ON FUNCTION record_ad_impression TO public;

-- Create stored procedure for creating reports
CREATE OR REPLACE FUNCTION create_content_report(
    p_content_type TEXT,
    p_content_id UUID,
    p_content_title TEXT,
    p_reason TEXT,
    p_reporter_id UUID
) RETURNS SETOF content_reports
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO content_reports (
        content_type,
        content_id,
        content_title,
        reason,
        reporter_id
    )
    VALUES (
        p_content_type,
        p_content_id,
        p_content_title,
        p_reason,
        p_reporter_id
    )
    RETURNING *;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_content_report TO public;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_content_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_reports_updated_at
    BEFORE UPDATE ON content_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_content_reports_updated_at();

-- Create views for easy querying
CREATE VIEW active_notifications AS
SELECT * FROM notifications
WHERE status = 'scheduled' 
AND scheduled_for > NOW()
ORDER BY scheduled_for;

CREATE VIEW pending_reports AS
SELECT 
    r.*,
    p.name as reporter_name,
    rp.name as resolver_name
FROM content_reports r
LEFT JOIN profiles p ON r.reporter_id = p.id
LEFT JOIN profiles rp ON r.resolved_by = rp.id
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_app_setting(
    p_key VARCHAR,
    p_value JSONB,
    p_user_id UUID
) RETURNS app_settings AS $$
DECLARE
    result app_settings;
BEGIN
    INSERT INTO app_settings (key, value, updated_by)
    VALUES (p_key, p_value, p_user_id)
    ON CONFLICT (key) DO UPDATE
    SET value = p_value,
        updated_by = p_user_id,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION schedule_notification(
    p_title VARCHAR,
    p_message TEXT,
    p_target VARCHAR,
    p_schedule TIMESTAMPTZ,
    p_user_id UUID
) RETURNS notifications AS $$
DECLARE
    result notifications;
BEGIN
    INSERT INTO notifications (
        title,
        message,
        target_audience,
        scheduled_for,
        status,
        created_by
    )
    VALUES (
        p_title,
        p_message,
        p_target,
        p_schedule,
        'scheduled',
        p_user_id
    )
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create initial super admin
CREATE OR REPLACE FUNCTION create_initial_super_admin(
  p_user_id UUID
) RETURNS jsonb AS $$
#variable_conflict use_column
DECLARE
  new_role admin_roles;
  updated_profile profiles;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- Create Super Admin role
  INSERT INTO admin_roles (name, description)
  VALUES ('Super Admin', 'Has full access to all admin features')
  RETURNING * INTO new_role;

  -- Insert permissions
  INSERT INTO admin_permissions (role_id, name, description, enabled)
  VALUES 
    (new_role.id, 'manage_users', 'Can manage all user accounts', true),
    (new_role.id, 'manage_content', 'Can manage all content', true),
    (new_role.id, 'manage_settings', 'Can modify app settings', true),
    (new_role.id, 'manage_ads', 'Can configure ad settings', true),
    (new_role.id, 'send_notifications', 'Can send push notifications', true),
    (new_role.id, 'manage_reports', 'Can handle content reports', true);

  -- Update profile
  UPDATE profiles 
  SET role_id = new_role.id
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;

  -- Assign role
  INSERT INTO admin_role_assignments (role_id, user_id)
  VALUES (new_role.id, p_user_id);

  RETURN jsonb_build_object(
    'role', row_to_json(new_role),
    'profile', row_to_json(updated_profile)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Admin role policies
CREATE POLICY "Allow read access to admin roles" ON admin_roles
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage roles" ON admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role_id IS NOT NULL
        )
    );

-- Admin permissions policies
CREATE POLICY "Allow read access to admin permissions" ON admin_permissions
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage permissions" ON admin_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role_id IS NOT NULL
        )
    );

-- Admin role assignments policies
CREATE POLICY "Allow read access to role assignments" ON admin_role_assignments
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage role assignments" ON admin_role_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role_id IS NOT NULL
        )
    );

-- App settings policies
CREATE POLICY "Admins can manage settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM admin_role_assignments ara
            INNER JOIN admin_permissions ap ON ap.role_id = ara.role_id
            WHERE ara.user_id = auth.uid()
            AND ap.name = 'manage_settings'
            AND ap.enabled = true
        )
    );

-- Notification policies
CREATE POLICY "Admins can manage notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM admin_role_assignments ara
            INNER JOIN admin_permissions ap ON ap.role_id = ara.role_id
            WHERE ara.user_id = auth.uid()
            AND ap.name = 'send_notifications'
            AND ap.enabled = true
        )
    );

-- Report policies
CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports" ON content_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM admin_role_assignments ara
            INNER JOIN admin_permissions ap ON ap.role_id = ara.role_id
            WHERE ara.user_id = auth.uid()
            AND ap.name = 'manage_reports'
            AND ap.enabled = true
        )
    );

-- Add role_id to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'role_id'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN role_id uuid REFERENCES admin_roles(id);
  END IF;
END $$;

-- Update create_admin_role function to create user credentials
CREATE OR REPLACE FUNCTION create_admin_role(
  p_name text,
  p_description text,
  p_email text,
  p_password text,
  p_permissions jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb AS $$
DECLARE
  new_role admin_roles;
  new_user RECORD;
  new_profile profiles;
BEGIN
  -- Create the role first
  INSERT INTO admin_roles (name, description)
  VALUES (p_name, p_description)
  RETURNING * INTO new_role;

  -- Create user account through auth.users
  new_user := auth.sign_up(
    p_email,
    p_password,
    jsonb_build_object(
      'email', p_email,
      'full_name', p_name,
      'role', 'authenticated'
    )
  );

  -- Create profile and link it to role
  INSERT INTO profiles (id, email, full_name, role_id)
  VALUES (new_user.id, p_email, p_name, new_role.id)
  RETURNING * INTO new_profile;

  -- Assign role to user
  INSERT INTO admin_role_assignments (role_id, user_id)
  VALUES (new_role.id, new_user.id);

  -- Insert permissions
  IF p_permissions IS NOT NULL AND jsonb_array_length(p_permissions) > 0 THEN
    INSERT INTO admin_permissions (role_id, name, enabled)
    SELECT 
      new_role.id,
      x->>'name',
      COALESCE((x->>'enabled')::boolean, false)
    FROM jsonb_array_elements(p_permissions) AS x;
  END IF;

  RETURN jsonb_build_object(
    'role', row_to_json(new_role),
    'profile', row_to_json(new_profile)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure admin user has correct permissions
CREATE OR REPLACE FUNCTION ensure_admin_permissions(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_id UUID;
    v_user_id UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', p_email;
    END IF;

    -- Create Super Admin role if it doesn't exist
    INSERT INTO admin_roles (name, description)
    VALUES ('Super Admin', 'Has full access to all admin features')
    ON CONFLICT (name) DO UPDATE
    SET description = EXCLUDED.description
    RETURNING id INTO v_role_id;

    -- Ensure all required permissions exist
    INSERT INTO admin_permissions (role_id, name, description, enabled)
    VALUES
        (v_role_id, 'manage_users', 'Can manage all user accounts', true),
        (v_role_id, 'manage_content', 'Can manage all content', true),
        (v_role_id, 'manage_settings', 'Can modify app settings', true),
        (v_role_id, 'manage_ads', 'Can configure ad settings', true),
        (v_role_id, 'send_notifications', 'Can send push notifications', true),
        (v_role_id, 'manage_reports', 'Can handle content reports', true)
    ON CONFLICT (role_id, name) DO UPDATE
    SET enabled = true,
        description = EXCLUDED.description;

    -- Ensure profile exists
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, p_email, 'Admin User')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    -- Ensure role assignment exists
    INSERT INTO admin_role_assignments (role_id, user_id)
    VALUES (v_role_id, v_user_id)
    ON CONFLICT (role_id, user_id) DO UPDATE
    SET assigned_at = NOW();

    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error ensuring admin permissions: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function to set up admin permissions
SELECT ensure_admin_permissions('admin@pdlebhaii.com');

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_admin_role(
    p_user_id UUID,
    p_role_id UUID
) RETURNS admin_role_assignments AS $$
DECLARE
    result admin_role_assignments;
BEGIN
    -- First, ensure the user exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;

    -- Then ensure the role exists
    IF NOT EXISTS (SELECT 1 FROM admin_roles WHERE id = p_role_id) THEN
        RAISE EXCEPTION 'Role does not exist';
    END IF;

    -- Insert or update the role assignment
    INSERT INTO admin_role_assignments (role_id, user_id)
    VALUES (p_role_id, p_user_id)
    ON CONFLICT (role_id, user_id) DO UPDATE
    SET assigned_at = NOW()
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default app settings
INSERT INTO app_settings (key, value, category) VALUES
('maintenance_mode', 'false'::jsonb, 'system'),
('allow_registrations', 'true'::jsonb, 'users'),
('ad_config', '{
    "admob_enabled": true,
    "banner_refresh_rate": 60,
    "rewarded_interval": 300
}'::jsonb, 'ads');
