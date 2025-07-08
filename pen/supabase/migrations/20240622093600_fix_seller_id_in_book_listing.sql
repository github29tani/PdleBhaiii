-- Drop the existing function if it exists
drop function if exists public.create_book_listing(jsonb, text[], jsonb);

-- Create the updated function to handle book listing creation
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
  result jsonb;
  seller_id uuid;
begin
  -- Get the authenticated user ID
  seller_id := auth.uid();
  if seller_id is null then
    raise exception 'User must be authenticated to create a listing';
  end if;

  -- Insert book data
  insert into public.books (
    title,
    author,
    description,
    subject,
    class_level,
    board_university,
    isbn
  ) values (
    book_data->>'title',
    book_data->>'author',
    book_data->>'description',
    book_data->>'subject',
    book_data->>'class_level',
    book_data->>'board_university',
    book_data->>'isbn'
  )
  returning id into book_id;

  -- Insert listing data
  insert into public.book_listings (
    book_id,
    seller_id,
    condition,
    price_inr,
    is_free,
    is_for_exchange,
    exchange_details,
    location,
    latitude,
    longitude,
    contact_preference,
    contact_phone,
    contact_whatsapp
  ) values (
    book_id,
    seller_id,
    (listing_data->>'condition')::book_condition,
    (listing_data->>'price_inr')::numeric(10,2),
    (listing_data->>'is_free')::boolean,
    (listing_data->>'is_for_exchange')::boolean,
    nullif(listing_data->>'exchange_details', '')::text,
    listing_data->>'location',
    nullif(listing_data->>'latitude', '')::numeric,
    nullif(listing_data->>'longitude', '')::numeric,
    (listing_data->>'contact_preference')::contact_preference,
    nullif(listing_data->>'contact_phone', '')::text,
    nullif(listing_data->>'contact_whatsapp', '')::text
  )
  returning id into listing_id;

  -- Insert image URLs if any
  if image_urls is not null and array_length(image_urls, 1) > 0 then
    foreach image_url in array image_urls
    loop
      if image_url is not null and trim(image_url) != '' then
        insert into public.book_images (listing_id, url, is_primary)
        values (listing_id, image_url, false);
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
    'detail', sqlstate,
    'context', pg_exception_context()
  ) into result;
  return result;
end;
$$;

-- Set function permissions
grant execute on function public.create_book_listing(jsonb, text[], jsonb) to authenticated;
