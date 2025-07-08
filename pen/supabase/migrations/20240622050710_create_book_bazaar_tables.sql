-- Drop existing tables if they exist
drop table if exists user_ratings cascade;
drop table if exists user_favorites cascade;
drop table if exists messages cascade;
drop table if exists book_images cascade;
drop table if exists book_listings cascade;
drop table if exists books cascade;

-- Drop existing types if they exist
drop type if exists book_condition cascade;
drop type if exists contact_preference cascade;
drop type if exists message_status cascade;

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "cube";
create extension if not exists "earthdistance" cascade;

-- Create enum types
create type book_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');
create type contact_preference as enum ('in_app', 'whatsapp', 'phone');
create type message_status as enum ('sent', 'delivered', 'read');

-- Books table
create table books (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  author text not null,
  isbn text,
  description text,
  subject text,
  class_level text,
  board_university text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Book Listings table
create table book_listings (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references books(id) on delete cascade not null,
  seller_id uuid references auth.users(id) on delete cascade not null,
  condition book_condition not null,
  price_inr numeric(10,2) not null,
  is_free boolean default false,
  is_for_exchange boolean default false,
  exchange_details text,
  location text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  contact_preference contact_preference default 'in_app',
  contact_phone text,
  contact_whatsapp text,
  is_sold boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Book Images table
create table book_images (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references book_listings(id) on delete cascade not null,
  url text not null,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references book_listings(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  status message_status default 'sent',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

-- Favorites table
create table user_favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  listing_id uuid references book_listings(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, listing_id)
);

-- User Ratings table
create table user_ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  rater_id uuid references auth.users(id) on delete cascade not null,
  listing_id uuid references book_listings(id) on delete cascade not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, rater_id, listing_id)
);

-- Create indexes for better query performance
create index idx_book_listings_seller_id on book_listings(seller_id);
create index idx_book_listings_book_id on book_listings(book_id);
-- Create a function-based index for earth distance calculations
create index idx_book_listings_location on book_listings using gist (
  earth_box(ll_to_earth(0, 0), 10000000) -- 10,000 km radius
);
create index idx_messages_listing_id on messages(listing_id);
create index idx_messages_sender_receiver on messages(sender_id, receiver_id);
create index idx_user_favorites_user_id on user_favorites(user_id);

-- Set up Row Level Security (RLS)
alter table books enable row level security;
alter table book_listings enable row level security;
alter table book_images enable row level security;
alter table messages enable row level security;
alter table user_favorites enable row level security;
alter table user_ratings enable row level security;

-- Create policies for book_images table
create policy "Users can insert images for their listings"
  on book_images for insert
  with check (
    exists (
      select 1 from book_listings
      where id = book_images.listing_id
      and seller_id = auth.uid()
    )
  );

create policy "Anyone can view book images"
  on book_images for select
  using (true);

-- Create policies for Books table
create policy "Public books are viewable by everyone"
  on books for select
  using (true);

create policy "Users can insert their own books"
  on books for insert
  with check (true);

-- Create policies for Book Listings
create policy "Active book listings are viewable by everyone"
  on book_listings for select
  using (is_active = true);

create policy "Users can manage their own listings"
  on book_listings
  using (auth.uid() = seller_id);

-- Create policies for Messages
create policy "Users can view their own messages"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on messages for insert
  with check (auth.uid() = sender_id);

-- Create policies for Favorites
create policy "Users can manage their own favorites"
  on user_favorites
  using (auth.uid() = user_id);

-- Create policies for Ratings
create policy "Users can view ratings"
  on user_ratings for select
  using (true);

create policy "Users can add ratings"
  on user_ratings for insert
  with check (auth.uid() = rater_id);

-- Create a function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers to update updated_at
create trigger update_books_updated_at
  before update on books
  for each row
  execute function update_updated_at_column();

create trigger update_book_listings_updated_at
  before update on book_listings
  for each row
  execute function update_updated_at_column();

-- Create a function to calculate average rating
create or replace function calculate_average_rating(user_uuid uuid)
returns numeric as $$
declare
  avg_rating numeric;
begin
  select coalesce(avg(rating), 0) into avg_rating
  from user_ratings
  where user_id = user_uuid;
  
  return round(avg_rating * 2) / 2; -- Round to nearest 0.5
end;
$$ language plpgsql stable;
