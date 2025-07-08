-- Create analytics tables
create table if not exists analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  user_id uuid references auth.users(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists daily_stats (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  active_users int default 0,
  new_users int default 0,
  total_events int default 0,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table analytics_events enable row level security;
alter table daily_stats enable row level security;

-- Allow admins to read analytics data
create policy "Enable read access for admin users on analytics_events"
on analytics_events for select
to authenticated
using (
  exists (
    select 1 from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = auth.uid()
    and p.role = 'admin'
  )
);

create policy "Enable read access for admin users on daily_stats"
on daily_stats for select
to authenticated
using (
  exists (
    select 1 from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = auth.uid()
    and p.role = 'admin'
  )
);

-- Function to record an event
create or replace function record_analytics_event(
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into analytics_events (event_type, user_id, metadata)
  values (p_event_type, auth.uid(), p_metadata);
end;
$$;

-- Function to get daily stats
create or replace function get_daily_stats(
  p_start_date date,
  p_end_date date
)
returns setof daily_stats
language plpgsql
security definer
as $$
begin
  -- Verify the user is an admin
  if not exists (
    select 1 from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = auth.uid()
    and p.role = 'admin'
  ) then
    raise exception 'Only admin users can view analytics';
  end if;

  return query
  select *
  from daily_stats
  where date between p_start_date and p_end_date
  order by date;
end;
$$;

-- Function to update daily stats
create or replace function update_daily_stats(p_date date default current_date)
returns void
language plpgsql
security definer
as $$
declare
  v_active_users int;
  v_new_users int;
  v_total_events int;
begin
  -- Get active users for the day
  select count(distinct user_id)
  into v_active_users
  from analytics_events
  where date(created_at) = p_date
  and user_id is not null;

  -- Get new users for the day
  select count(*)
  into v_new_users
  from auth.users
  where date(created_at) = p_date;

  -- Get total events for the day
  select count(*)
  into v_total_events
  from analytics_events
  where date(created_at) = p_date;

  -- Update or insert daily stats
  insert into daily_stats (date, active_users, new_users, total_events)
  values (p_date, v_active_users, v_new_users, v_total_events)
  on conflict (date)
  do update set
    active_users = excluded.active_users,
    new_users = excluded.new_users,
    total_events = excluded.total_events,
    updated_at = now();
end;
$$;
