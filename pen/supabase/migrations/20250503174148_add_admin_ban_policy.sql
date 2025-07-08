-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update user ban status" ON profiles;
DROP POLICY IF EXISTS "Admins can view user reports" ON user_reports;
DROP POLICY IF EXISTS "Admins can view any profile" ON profiles;

-- Add policies for admin to manage user bans
CREATE POLICY "Admins can update user ban status"
ON profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Add updated policy for profile updates
CREATE POLICY "Users can update own profile or admins can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id OR
    EXISTS (
        SELECT 1 
        FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
)
WITH CHECK (
    auth.uid() = id OR
    EXISTS (
        SELECT 1 
        FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Add policy for viewing user reports
CREATE POLICY "Admins can view user reports"
ON user_reports
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Add policy for admins to view any profile
CREATE POLICY "Admins can view any profile"
ON profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);
