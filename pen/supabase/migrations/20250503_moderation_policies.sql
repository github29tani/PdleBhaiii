-- Create moderation policies
create policy "Enable read access for authenticated users"
on content_reports for select
to authenticated
using (
  auth.uid() in (
    select id from users where role = 'admin'
  )
);

create policy "Enable update access for admin users"
on content_reports for update
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

-- Create moderation functions
drop function if exists manage_content_report(uuid,text,text,uuid);

create function manage_content_report(
  p_report_id uuid,
  p_status text,
  p_resolution_note text,
  p_resolver_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- Verify the user is an admin
  if not exists (
    select 1 from users 
    where id = auth.uid() 
    and role = 'admin'
  ) then
    raise exception 'Only admin users can manage reports';
  end if;

  -- Update the report status
  update content_reports
  set 
    status = p_status,
    resolution_note = p_resolution_note,
    resolved_by = p_resolver_id,
    updated_at = now()
  where id = p_report_id;

  -- Handle the reported content based on status
  if p_status = 'resolved' then
    -- You can add additional logic here to handle the reported content
    -- For example, mark it as reviewed, update flags, etc.
    null;
  end if;
end;
$$;
