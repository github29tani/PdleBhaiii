-- Add default avatar to storage
insert into storage.objects (
  bucket_id,
  name,
  owner,
  metadata
)
values (
  'avatars',
  'default-avatar.png',
  auth.uid(),
  jsonb_build_object(
    'mimetype', 'image/png',
    'size', 1024,
    'cacheControl', '3600'
  )
);

-- Update profiles to use default avatar if none set
update profiles
set avatar_url = 'https://projecti123.supabase.co/storage/v1/object/public/avatars/default-avatar.png'
where avatar_url is null;
