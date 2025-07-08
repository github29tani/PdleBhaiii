-- Drop existing table if it exists
drop table if exists public.followers;

-- Create followers table
create table public.followers (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- Create indexes
create index if not exists followers_follower_id_idx on public.followers(follower_id);
create index if not exists followers_following_id_idx on public.followers(following_id);

-- Set up Row Level Security (RLS)
alter table public.followers enable row level security;

-- Create policies
create policy "Users can view all followers"
  on public.followers for select
  using (true);

create policy "Users can insert their own follows"
  on public.followers for insert
  with check (auth.uid() = follower_id);

create policy "Users can delete their own follows"
  on public.followers for delete
  using (auth.uid() = follower_id);
