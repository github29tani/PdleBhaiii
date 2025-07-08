-- Add new columns to notes table
alter table notes 
add column if not exists views integer default 0,
add column if not exists ad_clicks integer default 0,
add column if not exists earnings numeric(10,2) default 0;

-- Add earnings columns to profiles table
alter table profiles
add column if not exists total_earnings numeric(10,2) default 0,
add column if not exists is_verified boolean default false,
add column if not exists verification_reason text,
add column if not exists support_upi text,
add column if not exists support_count integer default 0;

-- Create wishlists table
create table if not exists wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  note_id uuid references notes on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, note_id)
);

-- Create creator_earnings_history table
create table if not exists creator_earnings_history (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users on delete cascade not null,
  amount numeric(10,2) not null,
  type text check (type in ('ad_revenue', 'support_tip', 'withdrawal')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_notes_views on notes(views desc);
create index if not exists idx_notes_earnings on notes(earnings desc);
create index if not exists idx_profiles_total_earnings on profiles(total_earnings desc);
create index if not exists idx_creator_earnings_history_creator_id on creator_earnings_history(creator_id);
create index if not exists idx_wishlists_user_id on wishlists(user_id);
create index if not exists idx_wishlists_note_id on wishlists(note_id);
