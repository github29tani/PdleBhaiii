-- Enable RLS on notes table
alter table notes enable row level security;

-- Allow users to delete their own notes
create policy "Users can delete their own notes"
on notes for delete
using (uploader_id = auth.uid());

-- Allow users to select any notes
create policy "Anyone can view notes"
on notes for select
using (true);

-- Allow authenticated users to insert notes
create policy "Authenticated users can insert notes"
on notes for insert
to authenticated
with check (auth.uid() = uploader_id);

-- Allow users to update their own notes
create policy "Users can update their own notes"
on notes for update
using (uploader_id = auth.uid());
