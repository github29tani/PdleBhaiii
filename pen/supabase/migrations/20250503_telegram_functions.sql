-- Function to delete telegram group
CREATE OR REPLACE FUNCTION delete_telegram_group(
    p_id UUID
) RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM admin_role_assignments ara
        INNER JOIN admin_roles ar ON ara.role_id = ar.id
        WHERE ara.user_id = auth.uid()
        AND ar.name = 'Super Admin'
    ) THEN
        RAISE EXCEPTION 'Only admin users can delete telegram groups';
    END IF;

    DELETE FROM telegram_groups WHERE id = p_id;
END;
$$;

-- Function to update telegram group member count
CREATE OR REPLACE FUNCTION update_telegram_group_count(
    p_id UUID,
    p_count INTEGER
) RETURNS SETOF telegram_groups
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM admin_role_assignments ara
        INNER JOIN admin_roles ar ON ara.role_id = ar.id
        WHERE ara.user_id = auth.uid()
        AND ar.name = 'Super Admin'
    ) THEN
        RAISE EXCEPTION 'Only admin users can update telegram groups';
    END IF;

    RETURN QUERY
    UPDATE telegram_groups 
    SET member_count = p_count,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING *;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_telegram_group TO authenticated;
GRANT EXECUTE ON FUNCTION update_telegram_group_count TO authenticated;
