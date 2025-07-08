-- Function to get monthly user growth
create or replace function get_monthly_user_growth()
returns table (count bigint)
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
  with weeks as (
    select generate_series(
      date_trunc('week', current_date) - interval '5 weeks',
      date_trunc('week', current_date),
      '1 week'::interval
    ) as week
  )
  select coalesce(count(p.id), 0) as count
  from weeks w
  left join public.profiles p
    on date_trunc('week', p.created_at) = w.week
  group by w.week
  order by w.week desc;
end;
$$;

-- Function to get monthly note uploads
create or replace function get_monthly_note_uploads()
returns table (count bigint)
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
  with weeks as (
    select generate_series(
      date_trunc('week', current_date) - interval '5 weeks',
      date_trunc('week', current_date),
      '1 week'::interval
    ) as week
  )
  select coalesce(count(n.id), 0) as count
  from weeks w
  left join public.notes n
    on date_trunc('week', n.created_at) = w.week
  group by w.week
  order by w.week desc;
end;
$$;

-- Function to get monthly ad views
create or replace function get_monthly_ad_views()
returns table (count bigint)
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
  select count(*)
  from analytics_events
  where event_type = 'ad_view'
  and created_at >= date_trunc('month', current_date - interval '5 months')
  group by date_trunc('month', created_at)
  order by date_trunc('month', created_at)
  limit 6;
end;
$$;

-- Function to get monthly earnings
create or replace function get_monthly_earnings()
returns table (month_earnings numeric)
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
  select coalesce(sum((metadata->>'amount')::numeric), 0)
  from analytics_events
  where event_type = 'earnings'
  and created_at >= date_trunc('month', current_date - interval '5 months')
  group by date_trunc('month', created_at)
  order by date_trunc('month', created_at)
  limit 6;
end;
$$;

-- Function to get top subjects
create or replace function get_top_subjects()
returns table (subject text, count bigint)
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
  select n.subject, count(*) as count
  from notes n
  group by n.subject
  order by count desc
  limit 5;
end;
$$;
