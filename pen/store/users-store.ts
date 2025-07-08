import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface UsersState {
  searchResults: User[];
  isLoading: boolean;
  searchUsers: (query: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  searchResults: [],
  isLoading: false,

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          username,
          email,
          avatar_url,
          bio,
          subjects,
          interests,
          twitter_url,
          linkedin_url,
          instagram_url,
          github_url,
          website_url,
          is_verified,
          verification_reason,
          total_earnings,
          support_upi,
          support_count,
          created_at,
          updated_at
        `)
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      const formattedData = data?.map(user => ({
        ...user,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      })) || [];
      
      set({ searchResults: formattedData, isLoading: false });
    } catch (error) {
      console.error('Error searching users:', error);
      set({ searchResults: [], isLoading: false });
    }
  },
}));
