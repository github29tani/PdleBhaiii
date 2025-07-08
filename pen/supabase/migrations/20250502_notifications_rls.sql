-- Drop existing tables if they exist
drop table if exists public.notification_recipients cascade;
drop table if exists public.notifications cascade;
drop table if exists public.user_boards cascade;
drop table if exists public.user_subjects cascade;
drop table if exists public.user_classes cascade;
drop table if exists public.boards cascade;
drop table if exists public.subjects cascade;
drop table if exists public.classes cascade;

-- Create base tables for educational content
create table public.classes (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    created_at timestamp with time zone default now()
);

create table public.subjects (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    created_at timestamp with time zone default now()
);

create table public.boards (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    created_at timestamp with time zone default now()
);

-- Create junction tables for user associations
create table public.user_classes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    class_id uuid references public.classes(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(user_id, class_id)
);

create table public.user_subjects (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(user_id, subject_id)
);

create table public.user_boards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    board_id uuid references public.boards(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(user_id, board_id)
);

-- Create notifications table
create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    message text not null,
    sender_id uuid references auth.users(id),
    class_id uuid references public.classes(id),
    subject_id uuid references public.subjects(id),
    board_id uuid references public.boards(id),
    sent_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Create notification_recipients table to track who received and read notifications
create table public.notification_recipients (
    id uuid default gen_random_uuid() primary key,
    notification_id uuid references public.notifications(id) on delete cascade,
    user_id uuid references auth.users(id),
    read_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    unique(notification_id, user_id)
);

-- Enable RLS on all tables
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.boards enable row level security;
alter table public.user_classes enable row level security;
alter table public.user_subjects enable row level security;
alter table public.user_boards enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;

-- Base table policies
create policy "Allow public read of classes"
on public.classes for select
to authenticated
using (true);

create policy "Allow public read of subjects"
on public.subjects for select
to authenticated
using (true);

create policy "Allow public read of boards"
on public.boards for select
to authenticated
using (true);

-- User association policies
create policy "Allow users to view their class associations"
on public.user_classes for select
to authenticated
using (user_id = auth.uid());

create policy "Allow users to view their subject associations"
on public.user_subjects for select
to authenticated
using (user_id = auth.uid());

create policy "Allow users to view their board associations"
on public.user_boards for select
to authenticated
using (user_id = auth.uid());

-- Notification policies
create policy "Allow admins to insert notifications"
on public.notifications
for insert
to authenticated
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
);

create policy "Allow admins to view sent notifications"
on public.notifications
for select
to authenticated
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.is_admin = true
        and notifications.sender_id = auth.uid()
    )
);

create policy "Allow users to view notifications for their class/subject/board"
on public.notifications
for select
to authenticated
using (
    exists (
        select 1 from public.user_classes uc
        where (uc.user_id = auth.uid() and uc.class_id = notifications.class_id)
        or notifications.class_id is null
    )
    and
    exists (
        select 1 from public.user_subjects us
        where (us.user_id = auth.uid() and us.subject_id = notifications.subject_id)
        or notifications.subject_id is null
    )
    and
    exists (
        select 1 from public.user_boards ub
        where (ub.user_id = auth.uid() and ub.board_id = notifications.board_id)
        or notifications.board_id is null
    )
);

create policy "Allow admins to insert notification recipients"
on public.notification_recipients
for insert
to authenticated
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
);

create policy "Allow users to view their notification receipts"
on public.notification_recipients
for select
to authenticated
using (user_id = auth.uid());

create policy "Allow users to mark notifications as read"
on public.notification_recipients
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Grant access to authenticated users
grant select on public.classes to authenticated;
grant select on public.subjects to authenticated;
grant select on public.boards to authenticated;
grant select on public.user_classes to authenticated;
grant select on public.user_subjects to authenticated;
grant select on public.user_boards to authenticated;
grant select, insert on public.notifications to authenticated;
grant select, insert, update on public.notification_recipients to authenticated;

-- Insert some initial data
insert into public.classes (name) values 
    ('Class 6'),
    ('Class 7'),
    ('Class 8'),
    ('Class 9'),
    ('Class 10'),
    ('Class 11'),
    ('Class 12');

insert into public.subjects (name) values 
    ('Mathematics'),
    ('Science'),
    ('English'),
    ('Hindi'),
    ('Social Studies'),
    ('Physics'),
    ('Chemistry'),
    ('Biology'),
    ('Computer Science');

insert into public.boards (name) values 
    ('CBSE'),
    ('ICSE'),
    ('State Board');
