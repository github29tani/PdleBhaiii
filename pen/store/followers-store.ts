import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

interface FollowersStore {
  followers: UserProfile[];
  following: UserProfile[];
  currentUserFollowing: UserProfile[];
  isLoading: boolean;
  error: Error | null;
  getFollowers: (userId: string) => Promise<void>;
  getFollowing: (userId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  clearState: () => void;
}

export const useFollowingStore = create<FollowersStore>((set, get) => ({
  followers: [],
  following: [],
  currentUserFollowing: [],
  isLoading: false,
  error: null,

  clearState: () => {
    set({
      followers: [],
      following: [],
      error: null,
      isLoading: false
    });
  },

  getFollowers: async (userId: string) => {
    try {
      set({ isLoading: true, followers: [] }); 
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // First get all followers
      const { data: followerRows, error: followerError } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', userId);

      if (followerError) throw followerError;

      if (!followerRows?.length) {
        set({ followers: [] });
        return;
      }

      // Then get profile details for those followers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio')
        .in('id', followerRows.map(row => row.follower_id));

      if (profilesError) throw profilesError;

      set({ followers: profiles || [] });

      // If this is the current user's profile, also update their followers list
      if (currentUser && userId === currentUser.id) {
        set({ followers: profiles || [] });
      }
    } catch (error: any) {
      set({ error });
      console.error('Error fetching followers:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getFollowing: async (userId: string) => {
    try {
      set({ isLoading: true });
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data: followingRows, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      if (!followingRows?.length) {
        // Update either following or currentUserFollowing based on whether this is the viewed profile or current user
        if (currentUser && userId === currentUser.id) {
          set({ currentUserFollowing: [], following: [] });
        } else {
          set({ following: [] });
        }
        return;
      }

      // Get profile details for following users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio')
        .in('id', followingRows.map(row => row.following_id));

      if (profilesError) throw profilesError;

      // Update either following or currentUserFollowing based on whether this is the viewed profile or current user
      if (currentUser && userId === currentUser.id) {
        set({ currentUserFollowing: profiles || [], following: profiles || [] });
      } else {
        set({ following: profiles || [] });
      }
    } catch (error: any) {
      set({ error });
      console.error('Error fetching following:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  followUser: async (userId: string) => {
    try {
      set({ isLoading: true });
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user logged in');

      // First check if already following
      const { data: existingFollow } = await supabase
        .from('followers')
        .select('*')
        .match({ follower_id: currentUser.id, following_id: userId })
        .single();

      // If already following, just return
      if (existingFollow) {
        return;
      }

      const { error } = await supabase
        .from('followers')
        .insert({ follower_id: currentUser.id, following_id: userId });

      if (error) throw error;

      // Get the profile of the user we just followed
      const { data: followedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get our own profile
      const { data: currentUserProfile, error: currentUserProfileError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio')
        .eq('id', currentUser.id)
        .single();

      if (currentUserProfileError) throw currentUserProfileError;

      // Update both following and followers lists
      const currentFollowing = get().currentUserFollowing;
      const followers = get().followers;

      set({
        currentUserFollowing: [...currentFollowing, followedProfile],
        following: [...currentFollowing, followedProfile],
        followers: [...followers, currentUserProfile]
      });
    } catch (error: any) {
      // Only set error if it's not a duplicate key error
      if (error.code !== '23505') {
        set({ error });
        console.error('Error following user:', error);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      set({ isLoading: true });
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user logged in');

      const { error } = await supabase
        .from('followers')
        .delete()
        .match({ follower_id: currentUser.id, following_id: userId });

      if (error) throw error;

      // Update both following and followers lists
      const currentFollowing = get().currentUserFollowing;
      const followers = get().followers;

      set({
        currentUserFollowing: currentFollowing.filter(profile => profile.id !== userId),
        following: currentFollowing.filter(profile => profile.id !== userId),
        followers: followers.filter(profile => profile.id !== currentUser.id)
      });
    } catch (error: any) {
      set({ error });
      console.error('Error unfollowing user:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  isFollowing: (userId: string) => {
    return get().currentUserFollowing.some(user => user.id === userId);
  },
}));
