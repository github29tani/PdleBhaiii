import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export function useBookCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchBookCount = async () => {
      if (!user?.id) {
        setCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { count, error } = await supabase
          .from('book_listings')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .eq('is_active', true);

        if (error) throw error;

        setCount(count || 0);
      } catch (err) {
        console.error('Error fetching book count:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchBookCount();
  }, [user?.id]);

  return { count, loading, error };
}
