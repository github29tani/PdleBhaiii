-- Create note ratings table
create table if not exists note_ratings (
  id uuid default gen_random_uuid() primary key,
  note_id uuid references notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure one rating per user per note
  unique(note_id, user_id)
);

-- Enable RLS
alter table note_ratings enable row level security;

-- Create RLS policies
create policy "Users can view all note ratings"
  on note_ratings for select
  to authenticated
  using (true);

create policy "Users can rate notes"
  on note_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own ratings"
  on note_ratings for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own ratings"
  on note_ratings for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists idx_note_ratings_note_id on note_ratings(note_id);
create index if not exists idx_note_ratings_user_id on note_ratings(user_id);

-- Add average_rating and total_ratings columns to notes table
alter table notes 
add column if not exists average_rating numeric(3,2) default 0,
add column if not exists total_ratings integer default 0;

-- Create function to update note's average rating and total ratings
create or replace function update_note_rating_stats()
returns trigger as $$
begin
  -- For insert/update
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    -- Update average_rating and total_ratings
    update notes
    set 
      average_rating = (
        select round(avg(rating)::numeric, 2)
        from note_ratings
        where note_id = new.note_id
      ),
      total_ratings = (
        select count(*)
        from note_ratings
        where note_id = new.note_id
      )
    where id = new.note_id;
    return new;
  -- For delete
  elsif (TG_OP = 'DELETE') then
    -- Update average_rating and total_ratings
    update notes
    set 
      average_rating = (
        select round(avg(rating)::numeric, 2)
        from note_ratings
        where note_id = old.note_id
      ),
      total_ratings = (
        select count(*)
        from note_ratings
        where note_id = old.note_id
      )
    where id = old.note_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

-- Create triggers to update note rating stats
create trigger update_note_rating_stats_insert_update
  after insert or update on note_ratings
  for each row
  execute function update_note_rating_stats();

create trigger update_note_rating_stats_delete
  after delete on note_ratings
  for each row
  execute function update_note_rating_stats();
