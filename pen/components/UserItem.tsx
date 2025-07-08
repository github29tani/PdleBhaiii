import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User, UserCheck, UserPlus } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useFollowingStore } from '@/store/followers-store';
import { useAuthStore } from '@/store/auth-store';

interface UserItemProps {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  showFollowButton?: boolean;
}

export function UserItem({ id, name, username, avatar_url, bio, showFollowButton = true }: UserItemProps) {
  const { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } = useFollowingStore();
  const { user } = useAuthStore();
  const isCurrentUser = user?.id === id;

  const handleFollowPress = async () => {
    if (!user) return;

    if (isFollowing(id)) {
      await unfollowUser(id);
    } else {
      await followUser(id);
    }

    // Refresh followers and following lists
    await getFollowers(id);
    await getFollowing(id);
    if (user?.id) {
      await getFollowing(user.id);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push(`/user/${id}`)}
    >
      <View style={styles.avatarContainer}>
        {avatar_url ? (
          <Image 
            source={{ uri: avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <User size={24} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.username}>@{username}</Text>
        {bio && <Text style={styles.bio} numberOfLines={1}>{bio}</Text>}
      </View>

      {showFollowButton && !isCurrentUser && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing(id) ? styles.followingButton : styles.notFollowingButton
          ]}
          onPress={handleFollowPress}
        >
          {isFollowing(id) ? (
            <>
              <UserCheck size={16} color={colors.primary} />
              <Text style={[styles.followButtonText, { color: colors.primary }]}>Following</Text>
            </>
          ) : (
            <>
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={[styles.followButtonText, { color: '#FFFFFF' }]}>Follow</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  followingButton: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  notFollowingButton: {
    backgroundColor: colors.button, // Using the light green color for the Follow button
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});
