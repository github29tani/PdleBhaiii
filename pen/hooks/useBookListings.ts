import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

interface BookListing {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  created_at: string;
  book: {
    title: string;
    author: string;
    subject?: string;
    class_level?: string;
  };
  images: { url: string }[];
  seller: {
    id: string;
    avatar_url: string | null;
  };
}

interface UseBookListingsOptions {
  onlyMyAds?: boolean;
}

export function useBookListings({ onlyMyAds = false }: UseBookListingsOptions = {}) {
  const [books, setBooks] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('book_listings')
          .select(`
            *,
            book:books(*),
            images:book_images(url),
            seller:seller_id!inner(id, avatar_url)
          `)
          .eq('is_active', true);

        // If onlyMyAds is true, filter by current user's ID
        if (onlyMyAds && user?.id) {
          query = query.eq('seller_id', user.id);
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setBooks((data as BookListing[]) || []);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [onlyMyAds, user?.id]);

  return { books, loading, error };
}
