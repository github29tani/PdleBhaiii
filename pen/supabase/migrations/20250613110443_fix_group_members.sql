-- Add created_by column to groups table if it doesn't exist
ALTER TABLE IF EXISTS public.groups
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing groups with creator info if they don't have it
UPDATE public.groups g
SET created_by = (
    SELECT user_id 
    FROM public.group_members gm
    WHERE gm.group_id = g.id
    LIMIT 1
)
WHERE g.created_by IS NULL;

-- Create trigger to automatically add group creator to members
CREATE OR REPLACE FUNCTION public.add_creator_to_members()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert creator into group_members if they're not already there
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (NEW.id, NEW.created_by)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_add_creator_to_members ON public.groups;

-- Create the trigger
CREATE TRIGGER trg_add_creator_to_members
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.add_creator_to_members();
