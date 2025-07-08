-- Drop existing table if it exists
DROP TABLE IF EXISTS public.career_posts CASCADE;

-- Create career_posts table
CREATE TABLE IF NOT EXISTS public.career_posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  course_name text,
  content text not null,
  scope_description text,
  industry text,
  role text,
  experience_level text check (experience_level in ('entry', 'mid', 'senior', 'expert')),
  likes_count integer default 0,
  points_earned integer default 0,
  rating numeric default 0,
  comments_count integer default 0,
  is_saved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  group_id uuid not null,
  created_by uuid not null,
  foreign key (group_id) references public.groups (id),
  foreign key (created_by) references auth.users (id)
);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_group_member_created ON public.group_members;
DROP FUNCTION IF EXISTS public.handle_new_group_member;

-- Create a trigger to create a default career post when a user joins a group
CREATE OR REPLACE FUNCTION public.handle_new_group_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.career_posts (
    title,
    content,
    group_id,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    'Welcome to the group!',
    'Share your career journey and experiences here!',
    NEW.group_id,
    NEW.user_id,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_group_member_created
  AFTER INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_group_member();

-- Enable Row Level Security
alter table public.career_posts enable row level security;

-- Create RLS policies
-- First, drop the existing policy if it exists
drop policy if exists "career_posts_insert" on public.career_posts;

-- Create a simpler insert policy for testing
create policy "career_posts_insert"
  on public.career_posts
  for insert
  to authenticated
  with check (true);  -- Temporarily allow all authenticated users to insert

-- Create a function to check group membership
create or replace function is_group_member(group_id_param uuid, user_id_param uuid)
returns boolean as $$
begin
  return exists (
    select 1 
    from group_members 
    where group_id = group_id_param 
    and user_id = user_id_param
  );
end;
$$ language plpgsql security definer;

-- Policy for viewing posts (any authenticated user who is a group member)
create policy "career_posts_select"
  on public.career_posts
  for select
  to authenticated
  using (
    exists (
      select 1 
      from group_members gm
      where gm.group_id = group_id
      and gm.user_id = auth.uid()
    )
  );

-- Policy for updating posts (only the creator)
create policy "career_posts_update"
  on public.career_posts
  for update
  to authenticated
  using (
    auth.uid() = created_by
    and exists (
      select 1 
      from group_members gm
      where gm.group_id = group_id
      and gm.user_id = auth.uid()
    )
  );

-- Policy for deleting posts (only the creator or admin)
create policy "career_posts_delete"
  on public.career_posts
  for delete
  to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 
      from group_members gm
      where gm.group_id = group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at column
create trigger on_career_posts_updated
  before update on public.career_posts
  for each row
  execute procedure public.handle_updated_at();
