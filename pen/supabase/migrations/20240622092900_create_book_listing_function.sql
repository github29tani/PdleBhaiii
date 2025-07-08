-- Create the function to handle book listing creation
create or replace function public.create_book_listing(
  book_data jsonb,
  image_urls text[],
  listing_data jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  book_id uuid;
  listing_id uuid;
  image_url text;
  image_record jsonb;
  result jsonb;
begin
  -- Insert book data
  insert into public.books (
    title,
    author,
    description,
    subject,
    class_level,
    board,
    condition,
    user_id
  ) values (
    book_data->>'title',
    book_data->>'author',
    book_data->>'description',
    book_data->>'subject',
    book_data->>'class_level',
    book_data->>'board',
    book_data->>'condition',
    auth.uid()
  )
  returning id into book_id;

  -- Insert listing data
  insert into public.book_listings (
    book_id,
    price_inr,
    is_free,
    is_for_exchange,
    exchange_details,
    location,
    latitude,
    longitude,
    contact_preference,
    contact_phone,
    contact_whatsapp,
    condition,
    user_id
  ) values (
    book_id,
    (listing_data->>'price_inr')::numeric,
    (listing_data->>'is_free')::boolean,
    (listing_data->>'is_for_exchange')::boolean,
    listing_data->>'exchange_details',
    listing_data->>'location',
    (listing_data->>'latitude')::numeric,
    (listing_data->>'longitude')::numeric,
    listing_data->>'contact_preference',
    listing_data->>'contact_phone',
    listing_data->>'contact_whatsapp',
    listing_data->>'condition',
    auth.uid()
  )
  returning id into listing_id;

  -- Insert image URLs
  if image_urls is not null then
    foreach image_url in array image_urls
    loop
      if image_url is not null and trim(image_url) != '' then
        insert into public.book_images (book_id, image_url, user_id)
        values (book_id, image_url, auth.uid());
      end if;
    end loop;
  end if;

  -- Return success response
  select jsonb_build_object(
    'success', true,
    'book_id', book_id,
    'listing_id', listing_id
  ) into result;

  return result;
exception when others then
  -- Return error response
  select jsonb_build_object(
    'success', false,
    'error', sqlerrm,
    'detail', sqlstate
  ) into result;
  return result;
end;
$$;

-- Set function permissions
grant execute on function public.create_book_listing(jsonb, text[], jsonb) to authenticated;
