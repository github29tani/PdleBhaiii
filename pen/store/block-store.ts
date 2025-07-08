import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Block } from '@/types/block';

interface BlockStore {
  blockedUsers: Block[];
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  getBlockedUsers: () => Promise<void>;
  isBlocked: (userId: string) => boolean;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  blockedUsers: [],

  blockUser: async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Not authenticated');
      return;
    }

    // Check if user is already blocked
    const isAlreadyBlocked = get().blockedUsers.some(
      (blocked) => blocked.blocked_id === userId
    );

    if (isAlreadyBlocked) {
      console.log('User is already blocked');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error blocking user:', error);
        return;
      }

      if (!data || !data[0]) {
        console.error('No data returned from block operation');
        return;
      }

      const currentBlockedUsers = get().blockedUsers;
      set({
        blockedUsers: [...currentBlockedUsers, data[0]],
      });
    } catch (error) {
      console.error('Unexpected error blocking user:', error);
    }
  },

  unblockUser: async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) {
        console.error('Error unblocking user:', error);
        return;
      }

      const currentBlockedUsers = get().blockedUsers;
      set({
        blockedUsers: currentBlockedUsers.filter(
          (blocked) => blocked.blocked_id !== userId
        ),
      });
    } catch (error) {
      console.error('Unexpected error unblocking user:', error);
    }
  },

  getBlockedUsers: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Not authenticated');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', user.id);

      if (error) {
        console.error('Error fetching blocked users:', error);
        return;
      }

      if (!data) {
        console.error('No blocked users data returned');
        return;
      }

      set({ blockedUsers: data });
    } catch (error) {
      console.error('Unexpected error fetching blocked users:', error);
    }
  },

  isBlocked: (userId: string) => {
    return get().blockedUsers.some((blocked) => blocked.blocked_id === userId);
  },
}));
