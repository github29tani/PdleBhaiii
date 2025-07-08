-- Enable the storage extension if not already enabled
create extension if not exists "pg_net" with schema "extensions";
create extension if not exists "http" with schema "extensions";
create extension if not exists "pgcrypto" with schema "extensions";

-- Create a bucket for book images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book_images',
  'book_images',
  true,
  5242880, -- 5MB file size limit
  '{"image/jpeg", "image/png", "image/webp", "image/avif"}'
)
on conflict (name) do nothing;

-- Set up Row Level Security for the bucket
update storage.buckets set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = '{"image/jpeg", "image/png", "image/webp", "image/avif"}'
where name = 'book_images';

-- Drop existing policies if they exist
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Users can upload book images" on storage.objects;
drop policy if exists "Users can update their own book images" on storage.objects;
drop policy if exists "Users can delete their own book images" on storage.objects;

-- Create a policy to allow public read access to book images
create policy "Public Access"
on storage.objects for select
to public
using (bucket_id = 'book_images');

-- Create a policy to allow authenticated users to upload images
create policy "Users can upload book images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'book_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy to allow users to update their own images
create policy "Users can update their own book images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'book_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy to allow users to delete their own images
create policy "Users can delete their own book images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'book_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a function to generate a unique filename for uploads
create or replace function generate_book_image_filename(user_id uuid, filename text)
returns text
language plpgsql
as $$
begin
  return user_id::text || '/' || gen_random_uuid() || '.' || 
         (regexp_matches(lower(filename), '\.([a-z0-9]+)$'))[1];
end;
$$;

-- Create a function to get the public URL for a book image
create or replace function get_book_image_url(bucket_name text, file_path text)
returns text
language plpgsql
as $$
declare
  url text;
begin
  select concat(
    'https://',
    (select current_setting('app.settings.storage_bucket_url', true)),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    file_path
  ) into url;
  return url;
exception when others then
  return null;
end;
$$;
