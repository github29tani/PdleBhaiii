// pen/components/groups/ThreadList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Plus, MessageSquare, Clock, CheckCircle, Lock, Users } from 'lucide-react-native';

type Thread = {
  id: string;
  title: string;
  type: 'doubt' | 'formula' | 'concept' | 'past-year';
  message_count: number;
  last_updated: string;
  is_locked: boolean;
  is_resolved: boolean;
  created_by: string;
  user_avatar?: string;
  user_name?: string;
};

export function ThreadList({ groupId, isMember = false }: { groupId: string; isMember?: boolean }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          user:profiles!threads_created_by_fkey(avatar_url, full_name)
        `)
        .eq('group_id', groupId)
        .order('last_updated', { ascending: false });

      if (error) throw error;

      const formattedThreads = data.map(thread => ({
        ...thread,
        user_avatar: thread.user?.avatar_url,
        user_name: thread.user?.full_name || 'Anonymous',
      }));

      setThreads(formattedThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchThreads();

    // Set up real-time subscription
    const subscription = supabase
      .channel('threads_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'threads',
          filter: `group_id=eq.${groupId}`,
        },
        () => fetchThreads()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  const renderThread = ({ item }: { item: Thread }) => (
    <Card style={styles.threadCard}>
      <View style={styles.threadHeader}>
        <View style={styles.threadTitleContainer}>
          <Text style={styles.threadTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {(item.is_locked || item.is_resolved) && (
            <View style={styles.threadBadges}>
              {item.is_locked && (
                <View style={[styles.badge, styles.lockedBadge]}>
                  <Lock size={12} color={colors.text} />
                  <Text style={styles.badgeText}>Locked</Text>
                </View>
              )}
              {item.is_resolved && (
                <View style={[styles.badge, styles.resolvedBadge]}>
                  <CheckCircle size={12} color={colors.text} />
                  <Text style={styles.badgeText}>Resolved</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.threadMeta}>
          <View style={styles.metaItem}>
            <MessageSquare size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.message_count}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(item.last_updated).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.threadFooter}>
        <View style={styles.userInfo}>
          {item.user_avatar ? (
            <Image 
              source={{ uri: item.user_avatar }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.user_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.userName} numberOfLines={1}>
            {item.user_name}
          </Text>
        </View>
        <View style={styles.threadType}>
          <Text style={styles.threadTypeText}>
            {item.type.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discussion Threads</Text>
        {isMember && (
          <TouchableOpacity style={styles.newThreadButton}>
            <Plus size={20} color={colors.primary} />
            <Text style={styles.newThreadText}>New Thread</Text>
          </TouchableOpacity>
        )}
      </View>

      {threads.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No threads yet</Text>
          <Text style={styles.emptySubtext}>
            {isMember ? 'Start a new discussion' : 'Join the group to participate'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          renderItem={renderThread}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  newThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  newThreadText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  threadCard: {
    marginBottom: 12,
    padding: 16,
  },
  threadHeader: {
    marginBottom: 12,
  },
  threadTitleContainer: {
    marginBottom: 8,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  threadBadges: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  lockedBadge: {
    backgroundColor: colors.surface,
  },
  resolvedBadge: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 12,
  },
  userName: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  threadType: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  threadTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});