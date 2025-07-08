-- Create sticky notes table
create table if not exists sticky_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text,
  color text not null,
  position_x double precision not null,
  position_y double precision not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table sticky_notes enable row level security;

-- Create RLS policies
create policy "Users can view their own sticky notes"
  on sticky_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sticky notes"
  on sticky_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sticky notes"
  on sticky_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sticky notes"
  on sticky_notes for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists idx_sticky_notes_user_id on sticky_notes(user_id);

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger sticky_notes_updated_at
  before update on sticky_notes
  for each row
  execute procedure handle_updated_at();
