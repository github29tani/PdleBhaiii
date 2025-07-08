-- Set admin role for the first user (you can replace the user_id with your specific user id)
update public.profiles
set role = 'admin'
where id = (
  select id 
  from auth.users 
  where email = 'admin@pdlebhaii.com'
);
