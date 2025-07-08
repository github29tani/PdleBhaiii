-- Create saved_groups table
create table if not exists saved_groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_id)
);

-- Add RLS policies
alter table saved_groups enable row level security;

create policy "Users can view their saved groups"
  on saved_groups for select
  using (auth.uid() = user_id);

create policy "Users can insert their saved groups"
  on saved_groups for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their saved groups"
  on saved_groups for delete
  using (auth.uid() = user_id);
