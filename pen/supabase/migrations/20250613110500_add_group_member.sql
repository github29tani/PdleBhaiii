-- Add user as group member with role 'member'
INSERT INTO public.group_members (group_id, user_id, role)
VALUES ('8e8c1ee9-f003-4ee2-8529-05f40864ac49', '47eaa8b8-63bb-4bc7-87b5-3303a0e035e5', 'member')
ON CONFLICT DO NOTHING;

-- Verify the insertion
SELECT * FROM public.group_members
WHERE group_id = '8e8c1ee9-f003-4ee2-8529-05f40864ac49'
AND user_id = '47eaa8b8-63bb-4bc7-87b5-3303a0e035e5';
