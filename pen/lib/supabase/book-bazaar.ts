// Import Supabase client directly with types
import { createClient } from '@supabase/supabase-js';
// Use absolute path for database types to avoid module resolution issues
import type { Database } from '@/lib/supabase/database.types';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sulznkznjuhxbjpmjviv.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bHpua3puanVoeGJqcG1qdml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjA2MzAsImV4cCI6MjA2MDYzNjYzMH0.oQdMZMSACnKgTaI2vhB6RuH9s2C3ChIj5wbOodSQxl4';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Book = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  author: string;
  description: string | null;
  subject: string | null;
  isbn: string | null;
  class_level: string | null;
  board: string | null;
  condition: string | null;
  user_id: string;
  listings: BookListing[];
};

export type BookListing = Database['public']['Tables']['book_listings']['Row'] & {
  book: Database['public']['Tables']['books']['Row'];
  images: { url: string }[];
  seller: {
    id: string;
    avatar_url: string | null;
    name: string | null;
  };
};

export const BOOK_LISTINGS_QUERY = `
  *,
  book:books(*),
  images:book_images(url),
  seller:seller_id!inner(
    id,
    avatar_url,
    name
  )
`;

/**
 * Fetches book listings with optional filters
 */
export async function fetchBookListings({
  searchQuery = '',
  limit = 20,
  offset = 0,
  sortBy = 'created_at',
  sortOrder = 'desc',
  userId,
}: {
  searchQuery?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'book.title' | 'book.author' | 'price' | 'location' | 'custom';
  sortOrder?: 'asc' | 'desc';
  userId?: string;
}) {
  console.log('[BookBazaar] Fetching book listings with params:', {
    searchQuery,
    limit,
    offset,
    sortBy,
    sortOrder,
    userId,
  });

  try {
    let query = supabase
      .from('book_listings')
      .select(BOOK_LISTINGS_QUERY, { count: 'exact' })
      .eq('is_active', true)
      .eq('is_sold', false);

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'created_at':
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
          break;
        case 'book.title':
          query = query.order('book.title', { ascending: sortOrder === 'asc' });
          break;
        case 'book.author':
          query = query.order('book.author', { ascending: sortOrder === 'asc' });
          break;
        case 'price':
          query = query.order('price', { ascending: sortOrder === 'asc' });
          break;
        case 'location':
          query = query.order('location', { ascending: sortOrder === 'asc' });
          break;
        case 'custom':
          // Handle custom sorting logic if needed
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
          break;
        default:
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
      }
    }

    query = query.range(offset, offset + limit - 1);

    // Apply search filter if query exists
    if (searchQuery) {
      query = query.or(
        `book.title.ilike.%${searchQuery}%,book.author.ilike.%${searchQuery}%,book.subject.ilike.%${searchQuery}%`
      );
    }

    // Filter by user if userId is provided
    if (userId) {
      query = query.eq('seller_id', userId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[BookBazaar] Error fetching book listings:', error);
      throw error;
    }

    console.log(`[BookBazaar] Successfully fetched ${data?.length || 0} book listings`);
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('[BookBazaar] Unexpected error in fetchBookListings:', error);
    throw error;
  }
}

// Helper function to check if a string is a valid UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Fetches a single book listing by ID
 */
export async function fetchBookListingById(id: string | number) {
  console.log(`[BookBazaar] Fetching book listing with ID: ${id}`);
  const idString = id.toString();
  
  try {
    // First try to find by ID directly
    console.log('[BookBazaar] Starting direct ID lookup');
    // Fetch the book listing with basic info
    const { data: listingData, error: listingError } = await supabase
      .from('book_listings')
      .select(BOOK_LISTINGS_QUERY)
      .eq('id', idString)
      .single();

    if (listingError) {
      console.error('[BookBazaar] Error fetching book listing:', listingError);
      throw listingError;
    }

    if (!listingData) {
      console.error('[BookBazaar] Book listing not found');
      throw new Error('Book listing not found');
    }

    return listingData;
  } catch (error) {
    console.error('[BookBazaar] Error fetching book listing with ID', id, ':', error);
    throw error;
  }
}

/**
 * Deletes a book listing by ID
 */
export async function deleteBookListing(id: string): Promise<void> {
  console.log(`[BookBazaar] Starting deletion of book listing with ID: ${id}`);
  
  try {
    // First, get the book listing to get the book_id
    const { data: listing, error: fetchError } = await supabase
      .from('book_listings')
      .select('book_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('[BookBazaar] Error fetching book listing:', fetchError);
      throw fetchError;
    }

    if (!listing) {
      throw new Error('Book listing not found');
    }

    // First, try to delete the book listing to ensure we have the right ID
    const { error: listingError } = await supabase
      .from('book_listings')
      .delete()
      .eq('id', id);

    if (listingError) {
      console.error('[BookBazaar] Error deleting book listing:', listingError);
      throw listingError;
    }

    // Then try to delete associated images if they exist
    try {
      const { error: imagesError } = await supabase
        .from('book_images')
        .delete()
        .eq('book_listing_id', id);

      if (imagesError) {
        console.warn('[BookBazaar] Warning: Could not delete book images. They may not exist or the column name might be different.');
        // Continue with the deletion even if images can't be deleted
      }
    } catch (imagesError) {
      console.warn('[BookBazaar] Warning: Error while trying to delete book images:', imagesError);
      // Continue with the deletion even if images can't be deleted
    }

    // Finally, delete the associated book
    const { error: bookError } = await supabase
      .from('books')
      .delete()
      .eq('id', listing.book_id);

    if (bookError) {
      console.error('[BookBazaar] Error deleting book:', bookError);
      throw bookError;
    }

    console.log('[BookBazaar] Successfully deleted book listing and associated data');
  } catch (error) {
    console.error('[BookBazaar] Error in deleteBookListing:', error);
    throw error;
  }
}

/**
 * Creates a new book listing
 */
export async function createBookListing(bookData: {
  title: string;
  author: string;
  description: string;
  subject: string;
  class_level?: string;
  board_university?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  price_inr: number;
  is_free: boolean;
  is_for_exchange: boolean;
  exchange_details?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  contact_preference: 'in_app' | 'whatsapp' | 'phone';
  contact_phone?: string;
  contact_whatsapp?: string;
  images: string[]; // Array of image URLs
}) {
  console.log('[BookBazaar] Creating new book listing');

  try {
    // Start a transaction
    const { data, error } = await supabase.rpc('create_book_listing', {
      book_data: {
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        subject: bookData.subject,
        class_level: bookData.class_level || null,
        board_university: bookData.board_university || null,
      },
      listing_data: {
        condition: bookData.condition,
        price_inr: bookData.price_inr,
        is_free: bookData.is_free,
        is_for_exchange: bookData.is_for_exchange,
        exchange_details: bookData.exchange_details || null,
        location: bookData.location,
        latitude: bookData.latitude || null,
        longitude: bookData.longitude || null,
        contact_preference: bookData.contact_preference,
        contact_phone: bookData.contact_phone || null,
        contact_whatsapp: bookData.contact_whatsapp || null,
      },
      image_urls: bookData.images,
    });

    if (error) {
      console.error('[BookBazaar] Error creating book listing:', error);
      throw error;
    }

    console.log('[BookBazaar] Successfully created book listing:', data);
    return data;
  } catch (error) {
    console.error('[BookBazaar] Unexpected error creating book listing:', error);
    throw error;
  }
}

/**
 * Toggles favorite status for a book listing
 */
export async function toggleFavorite(listingId: string, userId: string) {
  console.log(`[BookBazaar] Toggling favorite for listing ${listingId}`);

  try {
    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[BookBazaar] Error checking favorite status:', checkError);
      throw checkError;
    }

    if (existing) {
      // Remove from favorites
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('[BookBazaar] Error removing from favorites:', deleteError);
        throw deleteError;
      }

      console.log('[BookBazaar] Removed from favorites');
      return false;
    } else {
      // Add to favorites
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert([{ user_id: userId, listing_id: listingId }]);

      if (insertError) {
        console.error('[BookBazaar] Error adding to favorites:', insertError);
        throw insertError;
      }

      console.log('[BookBazaar] Added to favorites');
      return true;
    }
  } catch (error) {
    console.error('[BookBazaar] Unexpected error toggling favorite:', error);
    throw error;
  }
}

/**
 * Fetches user's favorite book listings
 */
export async function fetchFavorites(userId: string) {
  console.log(`[BookBazaar] Fetching favorites for user: ${userId}`);

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(
        `
        listing:book_listings(
          ${BOOK_LISTINGS_QUERY}
        )
      `
      )
      .eq('user_id', userId);

    if (error) {
      console.error('[BookBazaar] Error fetching favorites:', error);
      throw error;
    }

    const favorites = data?.map((item) => item.listing).filter(Boolean) || [];
    console.log(`[BookBazaar] Found ${favorites.length} favorites`);
    return favorites;
  } catch (error) {
    console.error('[BookBazaar] Unexpected error fetching favorites:', error);
    throw error;
  }
}

/**
 * Sends a message to the seller
 */
export async function sendMessage({
  listingId,
  senderId,
  receiverId,
  content,
}: {
  listingId: string;
  senderId: string;
  receiverId: string;
  content: string;
}) {
  console.log(`[BookBazaar] Sending message for listing ${listingId}`);

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          listing_id: listingId,
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          status: 'sent',
        },
      ])
      .select();

    if (error) {
      console.error('[BookBazaar] Error sending message:', error);
      throw error;
    }

    console.log('[BookBazaar] Message sent successfully');
    return data?.[0];
  } catch (error) {
    console.error('[BookBazaar] Unexpected error sending message:', error);
    throw error;
  }
}

/**
 * Marks messages as read
 */
export async function markMessagesAsRead(messageIds: string[], userId: string) {
  console.log(`[BookBazaar] Marking ${messageIds.length} messages as read`);

  try {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .in('id', messageIds)
      .eq('receiver_id', userId)
      .eq('status', 'delivered');

    if (error) {
      console.error('[BookBazaar] Error marking messages as read:', error);
      throw error;
    }

    console.log('[BookBazaar] Messages marked as read');
  } catch (error) {
    console.error('[BookBazaar] Unexpected error marking messages as read:', error);
    throw error;
  }
}
