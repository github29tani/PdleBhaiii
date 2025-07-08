-- Drop all existing policies
drop policy if exists "group_members_select" on public.group_members;
drop policy if exists "group_members_insert" on public.group_members;
drop policy if exists "career_posts_insert" on public.career_posts;

-- Create a simple select policy that allows viewing all members
create policy "group_members_select"
on public.group_members
for select
to authenticated
using (auth.uid() = user_id);

-- Create a simple insert policy that only allows inserting self
create policy "group_members_insert"
on public.group_members
for insert
to authenticated
with check (auth.uid() = user_id);

-- Create a simple insert policy for career posts that checks group membership
create policy "career_posts_insert"
on public.career_posts
for insert
to authenticated
with check (
  exists (
    select 1 
    from group_members gm
    where gm.group_id = group_id
    and gm.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------------
-- Automatically add group creator to group_members
-- ------------------------------------------------------------------

-- Helper function
create or replace function add_creator_to_members()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id)
  values (NEW.id, NEW.created_by)
  on conflict do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger to ensure idempotency
 drop trigger if exists trg_add_creator_to_members on public.groups;
create trigger trg_add_creator_to_members
after insert on public.groups
for each row execute procedure add_creator_to_members();
