-- Drop existing policies
DROP POLICY IF EXISTS "Enable admin access to telegram_groups" ON telegram_groups;
DROP POLICY IF EXISTS "Enable read access to telegram_groups" ON telegram_groups;

-- Create policies for telegram_groups
CREATE POLICY "Enable admin access to telegram_groups"
ON telegram_groups
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_role_assignments ara
        INNER JOIN admin_roles ar ON ara.role_id = ar.id
        WHERE ara.user_id = auth.uid()
        AND ar.name = 'Super Admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_role_assignments ara
        INNER JOIN admin_roles ar ON ara.role_id = ar.id
        WHERE ara.user_id = auth.uid()
        AND ar.name = 'Super Admin'
    )
);

CREATE POLICY "Enable read access to telegram_groups"
ON telegram_groups
FOR SELECT
USING (true);

-- Grant necessary permissions
GRANT ALL ON telegram_groups TO authenticated;
GRANT EXECUTE ON FUNCTION insert_telegram_group TO authenticated;
