import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, UserX } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { useBlockStore } from '@/store/block-store';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { blockedUsers, getBlockedUsers, unblockUser } = useBlockStore();
  const [loading, setLoading] = useState(true);
  const [blockedProfiles, setBlockedProfiles] = useState<Array<{
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  }>>([]);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        setLoading(true);
        await getBlockedUsers();
      } catch (error) {
        console.error('Error fetching blocked users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  useEffect(() => {
    const fetchBlockedProfiles = async () => {
      if (blockedUsers.length === 0) {
        setBlockedProfiles([]);
        return;
      }

      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', blockedUsers.map(b => b.blocked_id));

        if (error) throw error;
        
        setBlockedProfiles(profiles || []);
      } catch (error) {
        console.error('Error fetching blocked profiles:', error);
      }
    };

    fetchBlockedProfiles();
  }, [blockedUsers]);

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId);
      // Remove the unblocked user from local state
      setBlockedProfiles(prev => prev.filter(profile => profile.id !== userId));
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocked Users</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {blockedProfiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UserX size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No blocked users</Text>
            <Text style={styles.emptySubtext}>Users you block will appear here</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {blockedProfiles.map((profile) => (
              <View key={profile.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  {profile.avatar_url ? (
                    <Image 
                      source={{ uri: profile.avatar_url }} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {profile.name || 'Anonymous User'}
                    </Text>
                    {profile.username && (
                      <Text style={styles.userUsername} numberOfLines={1}>
                        @{profile.username}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.unblockButton}
                  onPress={() => handleUnblock(profile.id)}
                >
                  <Text style={styles.unblockButtonText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});
