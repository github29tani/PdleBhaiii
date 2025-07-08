import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { 
  Users, UserPlus, UserMinus, MessageCircle, 
  Users2, Lock, Globe, Mail, Trash2, Shield, AlertTriangle 
} from 'lucide-react-native';

type Group = {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'invite-only';
  member_count: number;
  created_at: string;
  is_verified: boolean;
};

type UserReport = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  reporter: {
    username: string;
    avatar_url: string;
  };
  reported: {
    username: string;
    avatar_url: string;
  };
};

export default function SocialModeration() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'groups' | 'reports'>('groups');

  // Fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['admin', 'groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Group[];
    },
  });

  // Fetch user reports
  const { data: userReports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['admin', 'user_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reports')
        .select(`
          *,
          reporter:profiles!reporter_id(username, avatar_url),
          reported:profiles!reported_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as UserReport[];
    },
  });

  // Toggle group verification status
  const toggleGroupVerification = useMutation({
    mutationFn: async ({ groupId, verified }: { groupId: string, verified: boolean }) => {
      const { error } = await supabase
        .from('groups')
        .update({ is_verified: verified })
        .eq('id', groupId);
      
      if (error) throw error;
      return { groupId, verified };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
    },
  });

  // Handle report resolution
  const resolveReport = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string, action: 'dismiss' | 'warn' | 'ban' }) => {
      const { error } = await supabase
        .from('user_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);
      
      if (error) throw error;
      return { reportId, action };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user_reports'] });
    },
  });

  const renderGroupItem = ({ item }: { item: Group }) => (
    <View style={styles.card}>
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <Users2 size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.member_count} members</Text>
            </View>
            <View style={[styles.groupType, item.type === 'public' ? styles.typePublic : styles.typePrivate]}>
              {item.type === 'public' ? <Globe size={14} /> : <Lock size={14} />}
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.verifyButton, item.is_verified && styles.verifiedButton]}
          onPress={() => toggleGroupVerification.mutate({ groupId: item.id, verified: !item.is_verified })}
        >
          <Shield size={16} color={item.is_verified ? colors.success : colors.textSecondary} />
          <Text style={[styles.verifyText, item.is_verified && styles.verifiedText]}>
            {item.is_verified ? 'Verified' : 'Verify'}
          </Text>
        </TouchableOpacity>
      </View>
      {item.description && <Text style={styles.groupDescription}>{item.description}</Text>}
    </View>
  );

  const renderReportItem = ({ item }: { item: UserReport }) => (
    <View style={styles.card}>
      <View style={styles.reportHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.reported.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.username}>@{item.reported.username}</Text>
            <Text style={styles.reportedBy}>Reported by @{item.reporter.username}</Text>
          </View>
        </View>
        <Text style={styles.reportReason}>{item.reason}</Text>
      </View>
      <View style={styles.reportActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.warnButton]}
          onPress={() => resolveReport.mutate({ reportId: item.id, action: 'warn' })}
        >
          <AlertTriangle size={16} color={colors.warning} />
          <Text style={[styles.actionText, { color: colors.warning }]}>Warn User</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.banButton]}
          onPress={() => resolveReport.mutate({ reportId: item.id, action: 'ban' })}
        >
          <UserMinus size={16} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Ban User</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.dismissButton]}
          onPress={() => resolveReport.mutate({ reportId: item.id, action: 'dismiss' })}
        >
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Users2 size={18} color={activeTab === 'groups' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <AlertTriangle size={18} color={activeTab === 'reports' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            User Reports
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'groups' ? (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No groups found</Text>
            </View>
          }
          refreshing={isLoadingGroups}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] })}
        />
      ) : (
        <FlatList
          data={userReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No reports found</Text>
            </View>
          }
          refreshing={isLoadingReports}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin', 'user_reports'] })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  groupType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  typePublic: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  typePrivate: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  typeText: {
    fontSize: 12,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  groupDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifiedButton: {
    borderColor: colors.success,
  },
  verifyText: {
    fontSize: 12,
    marginLeft: 4,
    color: colors.textSecondary,
  },
  verifiedText: {
    color: colors.success,
  },
  reportHeader: {
    marginBottom: 12,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: colors.border,
  },
  username: {
    fontWeight: '600',
    color: colors.text,
  },
  reportedBy: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reportReason: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    marginBottom: 4,
  },
  warnButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  banButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
