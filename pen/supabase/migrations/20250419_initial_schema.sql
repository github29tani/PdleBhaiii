-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.profiles (
    id uuid references auth.users not null primary key,
    username text not null unique,
    name text not null,
    email text not null unique,
    avatar text,
    bio text,
    interests text[] default '{}',
    subjects text[] default '{}',
    level integer default 1,
    xp integer default 0,
    followers integer default 0,
    following integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notes table
create table public.notes (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    subject text not null,
    class text not null,
    board text,
    topic text not null,
    file_type text not null check (file_type in ('pdf', 'image', 'doc')),
    file_url text not null,
    thumbnail_url text,
    uploader_id uuid references public.profiles(id) not null,
    likes integer default 0,
    downloads integer default 0,
    comments integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comments table
create table public.comments (
    id uuid default uuid_generate_v4() primary key,
    note_id uuid references public.notes(id) not null,
    user_id uuid references public.profiles(id) not null,
    text text not null,
    likes integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create earnings table
create table public.earnings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    total decimal(10,2) default 0,
    withdrawable decimal(10,2) default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create earning transactions table
create table public.earning_transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    amount decimal(10,2) not null,
    type text not null check (type in ('ad_view', 'download', 'withdrawal')),
    note_id uuid references public.notes(id),
    status text not null check (status in ('pending', 'completed', 'failed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create categories table
create table public.categories (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique,
    icon text not null,
    color text not null
);

-- Create boards table
create table public.boards (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique
);

-- Create classes table
create table public.classes (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique
);

-- Create subjects table
create table public.subjects (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique,
    color text not null
);

-- Create exam_types table
create table public.exam_types (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique
);

-- Create likes table for note likes
create table public.note_likes (
    user_id uuid references public.profiles(id) not null,
    note_id uuid references public.notes(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, note_id)
);

-- Create bookmarks table
create table public.bookmarks (
    user_id uuid references public.profiles(id) not null,
    note_id uuid references public.notes(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, note_id)
);

-- Create followers table
create table public.followers (
    follower_id uuid references public.profiles(id) not null,
    following_id uuid references public.profiles(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (follower_id, following_id)
);

-- Create storage bucket for notes if it doesn't exist
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Create policy to allow public read access to notes bucket
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'notes' );

-- Create policy to allow users to upload files
drop policy if exists "Users can upload files" on storage.objects;
create policy "Users can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow users to update their own files
drop policy if exists "Users can update own files" on storage.objects;
create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow users to delete their own files
drop policy if exists "Users can delete own files" on storage.objects;
create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create RLS policies
alter table public.profiles disable row level security;
alter table public.notes enable row level security;
alter table public.comments enable row level security;
alter table public.earnings enable row level security;
alter table public.earning_transactions enable row level security;
alter table public.note_likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.followers enable row level security;

-- Create RLS policies for profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can create their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Create RLS policies for notes
create policy "Notes are viewable by everyone"
  on public.notes for select
  using ( true );

create policy "Authenticated users can create notes"
  on public.notes for insert
  with check ( auth.role() = 'authenticated' and uploader_id = auth.uid() );

create policy "Users can update own notes"
  on public.notes for update
  using ( auth.uid() = uploader_id );

create policy "Users can delete own notes"
  on public.notes for delete
  using ( auth.uid() = uploader_id );

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check if profile already exists
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  -- Insert new profile
  insert into public.profiles (
    id,
    username,
    name,
    email
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
exception
  when others then
    -- Log error details
    raise warning 'Error in handle_new_user: %', SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create functions for real-time counts
create or replace function public.handle_note_like()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.notes set likes = likes + 1 where id = NEW.note_id;
  elsif (TG_OP = 'DELETE') then
    update public.notes set likes = likes - 1 where id = OLD.note_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_note_like
  after insert or delete on public.note_likes
  for each row execute procedure public.handle_note_like();

-- Create function to handle follower counts
create or replace function public.handle_follower()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles set followers = followers + 1 where id = NEW.following_id;
    update public.profiles set following = following + 1 where id = NEW.follower_id;
  elsif (TG_OP = 'DELETE') then
    update public.profiles set followers = followers - 1 where id = OLD.following_id;
    update public.profiles set following = following - 1 where id = OLD.follower_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_follower_change
  after insert or delete on public.followers
  for each row execute procedure public.handle_follower();
