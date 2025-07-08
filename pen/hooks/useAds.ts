import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Ad } from '@/types/ads';
import { useAuthStore } from '@/store/auth-store';

export const useAds = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const fetchAd = useCallback(async (
    placement: Ad['placement'],
    subject?: string,
    className?: string
  ): Promise<Ad | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_relevant_ads', {
          p_placement: placement,
          p_subject: subject,
          p_class: className,
          p_limit: 1
        });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching ad:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordImpression = useCallback(async (
    ad: Ad,
    type: 'view' | 'click',
    noteId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('ad_impressions')
        .insert({
          ad_id: ad.id,
          user_id: user?.id,
          note_id: noteId || null,
          impression_type: type,
          ad_unit_id: 'default' // Using default as the ad unit ID
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  }, [user]);

  return {
    loading,
    fetchAd,
    recordImpression
  };
};
