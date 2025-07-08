import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// Update the interfaces first
interface UserData {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
}

interface FollowingState {
  followingCount: number;
  followersCount: number;
  followingIds: string[];
  followingUsers: UserData[];
  followers: UserData[];
  isLoading: boolean;
  error: string | null;
  
  fetchFollowingCount: (userId: string) => Promise<void>;
  fetchFollowersCount: (userId: string) => Promise<void>;
  fetchFollowingIds: () => Promise<void>;
  fetchFollowers: (userId: string) => Promise<void>;
  toggleFollow: (targetUserId: string) => Promise<void>;
  isFollowing: (targetUserId: string) => boolean;
}

export const useFollowingStore = create<FollowingState>()((set, get) => ({
  followingCount: 0,
  followersCount: 0,
  followingIds: [],
  followingUsers: [],
  followers: [], // Initialize followers array
  isLoading: false,
  error: null,

  fetchFollowingCount: async (userId) => {
    try {
      // Log the user ID we're querying for
      console.log('Fetching following count for user:', userId);
      
      const { count, error } = await supabase
        .from('followers')
        .select('following_id', { count: 'exact' })
        .eq('follower_id', userId);

      console.log('Following count result:', { count, error });

      if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }
      set({ followingCount: count || 0 });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch following count' });
    }
  },

  fetchFollowersCount: async (userId) => {
    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }
      set({ followersCount: count || 0 });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch followers count' });
    }
  },

  fetchFollowingIds: async () => {
    console.log('Fetching following IDs...');
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) throw new Error('Not authenticated');

      // Fetch both following and followers data
      const [followingResult, followersResult] = await Promise.all([
        supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId),
        supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', userId)
      ]);

      if (followingResult.error) throw followingResult.error;
      if (followersResult.error) throw followersResult.error;
      
      const followingIds = followingResult.data?.map(f => f.following_id) || [];
      const followerIds = followersResult.data?.map(f => f.follower_id) || [];
      
      // Fetch user data for both following and followers
      const allUserIds = [...new Set([...followingIds, ...followerIds])];
      
      if (allUserIds.length > 0) {
        const { data: userData, error: userDataError } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', allUserIds);

        if (userDataError) throw userDataError;

        const userMap = new Map(userData?.map(user => [user.id, user]) || []);
        
        const followingUsers = followingIds.map(id => {
          const user = userMap.get(id);
          return user ? {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url
          } : null;
        }).filter(Boolean);

        const followers = followerIds.map(id => {
          const user = userMap.get(id);
          return user ? {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url
          } : null;
        }).filter(Boolean);

        set({ 
          followingIds, 
          followingUsers, 
          followers,
          followingCount: followingIds.length,
          followersCount: followerIds.length,
          isLoading: false 
        });
      } else {
        set({ 
          followingIds: [], 
          followingUsers: [], 
          followers: [],
          followingCount: 0,
          followersCount: 0,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch following list',
        isLoading: false 
      });
    }
  },

  toggleFollow: async (targetUserId) => {
    if (!targetUserId) {
      console.error('No target user ID provided');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) throw new Error('Not authenticated');
      if (userId === targetUserId) throw new Error('Cannot follow yourself');

      const isCurrentlyFollowing = get().isFollowing(targetUserId);

      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId);

        if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }

        set(state => ({
          followingIds: state.followingIds.filter(id => id !== targetUserId),
          followingUsers: state.followingUsers.filter(user => user.id !== targetUserId),
          followingCount: state.followingCount - 1
        }));

        // Refresh following list
        await get().fetchFollowingIds();
      } else {
        // Check if already following
        const { data: existingFollow } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
          .single();

        if (existingFollow) {
          console.log('Already following this user');
          return;
        }

        console.log('Following user:', targetUserId);
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: userId,
            following_id: targetUserId,
            created_at: new Date().toISOString()
          });

        if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }

        console.log('Fetching user data for:', targetUserId);
        // Fetch user data for the new follow
        console.log('Fetching profile for user:', targetUserId);
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .eq('id', targetUserId)
          .single();

        console.log('Profile data result:', userData);

        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }

        const newUser: UserData = {
          id: userData.id,
          name: userData.name,
          username: session.user.user_metadata?.username || '',
          avatar_url: userData.avatar_url
        };

        set(state => ({
          followingIds: [...state.followingIds, targetUserId],
          followingUsers: [...state.followingUsers, newUser],
          followingCount: state.followingCount + 1
        }));

        // Refresh following list
        await get().fetchFollowingIds();
      }
    } catch (error) {
      console.error('Toggle follow error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle follow' });
    }
  },

  isFollowing: (targetUserId) => {
    return get().followingIds.includes(targetUserId);
  },  // Add comma here

  fetchFollowers: async (userId) => {  // Move inside the main object
    set({ isLoading: true });
    try {
      // Get followers
      const { data: followerData, error: followerError } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', userId);

      if (followerError) throw followerError;

      const followerIds = followerData?.map(f => f.follower_id) || [];

      // Get follower profiles
      if (followerIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', followerIds);

        if (userError) throw userError;

        const followers = userData?.map(user => ({
          id: user.id,
          name: user.name,
          username: user.username,
          avatar_url: user.avatar_url
        })) || [];

        set({ followers, isLoading: false });
      } else {
        set({ followers: [], isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch followers',
        isLoading: false 
      });
    }
  }
}));
