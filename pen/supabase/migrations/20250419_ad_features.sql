-- Create ad_stats table for tracking ad performance
create table public.ad_stats (
    id uuid default uuid_generate_v4() primary key,
    note_id uuid references public.notes(id) not null,
    creator_id uuid references public.profiles(id) not null,
    views integer default 0,
    clicks integer default 0,
    revenue decimal(10,2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ad_placements table for tracking where ads are shown
create table public.ad_placements (
    id uuid default uuid_generate_v4() primary key,
    note_id uuid references public.notes(id) not null,
    placement_type text not null check (placement_type in ('header', 'between_pages', 'sidebar')),
    ad_unit_id text not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better query performance
create index ad_stats_note_id_idx on public.ad_stats(note_id);
create index ad_stats_creator_id_idx on public.ad_stats(creator_id);
create index ad_placements_note_id_idx on public.ad_placements(note_id);
