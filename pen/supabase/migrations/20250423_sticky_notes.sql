create table sticky_notes (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    content text not null,
    color text not null default '#fff9c4',
    position jsonb not null default '{"x": 0, "y": 0}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table sticky_notes enable row level security;

-- Create policies
create policy "Users can view their own sticky notes"
    on sticky_notes for select
    using (auth.uid() = user_id);

create policy "Users can create their own sticky notes"
    on sticky_notes for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own sticky notes"
    on sticky_notes for update
    using (auth.uid() = user_id);

create policy "Users can delete their own sticky notes"
    on sticky_notes for delete
    using (auth.uid() = user_id);
