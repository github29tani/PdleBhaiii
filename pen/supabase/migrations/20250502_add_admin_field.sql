-- Add is_admin column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'is_admin') THEN
        alter table public.profiles
        add column is_admin boolean default false;
    END IF;
END $$;

-- Add RLS policy for is_admin field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE schemaname = 'public' 
                  AND tablename = 'profiles' 
                  AND policyname = 'Users can read is_admin field') THEN
        create policy "Users can read is_admin field"
        on public.profiles
        for select
        using (true);
    END IF;
END $$;

-- Only allow admins to update is_admin field if policy doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE schemaname = 'public' 
                  AND tablename = 'profiles' 
                  AND policyname = 'Only admins can update is_admin field') THEN
        create policy "Only admins can update is_admin field"
        on public.profiles
        for update
        using (auth.uid() in (
            select id from public.profiles where is_admin = true
        ))
        with check (auth.uid() in (
            select id from public.profiles where is_admin = true
        ));
    END IF;
END $$;

-- Set initial admin user if not already set
update public.profiles
set is_admin = true
where email = 'admin@studysphere.app'  -- Replace with your admin email
and not exists (
    select 1 from public.profiles where is_admin = true
);
