-- Drop existing foreign key constraints
alter table downloads drop constraint if exists downloads_note_id_fkey;
alter table creator_earnings_history drop constraint if exists creator_earnings_history_note_id_fkey;

-- Add cascade delete constraints
alter table downloads 
add constraint downloads_note_id_fkey 
foreign key (note_id) 
references notes(id) 
on delete cascade;



-- Add note_id to creator_earnings_history if it doesn't exist
alter table creator_earnings_history 
add column if not exists note_id uuid references notes(id) on delete cascade;
