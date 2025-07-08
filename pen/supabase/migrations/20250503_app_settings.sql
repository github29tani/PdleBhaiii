-- Create app settings table
create table if not exists app_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- Add RLS policies
alter table app_settings enable row level security;

create policy "Enable read access for all users"
on app_settings for select
to authenticated
using (true);

create policy "Enable update access for admin users"
on app_settings for update
to authenticated
using (
  auth.uid() in (
    select id from users where role = 'admin'
  )
) with check (
  auth.uid() in (
    select id from users where role = 'admin'
  )
);

-- Create function to update settings
create or replace function update_app_setting(
  p_settings jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  setting_record record;
begin
  -- Verify the user is an admin
  if not exists (
    select 1 from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = auth.uid()
    and u.email = 'admin@pdlebhaii.com'
    and p.role = 'admin'
  ) then
    raise exception 'Only admin users can update settings';
  end if;

  -- Update each setting
  for setting_record in
    select * from jsonb_each(p_settings)
  loop
    insert into app_settings (key, value, updated_by)
    values (setting_record.key, setting_record.value, auth.uid())
    on conflict (key)
    do update set 
      value = excluded.value,
      updated_at = now(),
      updated_by = excluded.updated_by;
  end loop;
end;
$$;
