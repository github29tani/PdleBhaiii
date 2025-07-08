import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';

export interface Book {
  id: string;
  book_id: string;
  seller_id: string;
  condition: string;
  price_inr: number;
  is_free: boolean;
  is_for_exchange: boolean;
  exchange_details: string | null;
  location: string;
  contact_preference: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  is_sold: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seller: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  book?: {
    title: string;
    author: string;
    isbn?: string;
  };
  images?: {
    url: string;
  }[];
};;

export interface UseBooksResult {
  books: Book[];
  isLoading: boolean;
  error: Error | null;
}

export function useBooks(): UseBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('book_listings')
          .select(`
            *,
            book:books(
              title,
              author,
              isbn
            ),
            images:book_images(url),
            seller:seller_id!inner(
              id,
              profiles!inner(
                name,
                avatar_url
              )
            )
          `)
          .order('created_at', { ascending: false })
          .eq('is_active', true);

        if (error) throw error;

        setBooks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch books'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooks();
  }, []);

  return { books, isLoading, error };
}
