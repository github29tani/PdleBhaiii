import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, UserCheck, UserX, Ban, Shield } from 'lucide-react-native';
import { colors } from '@/constants/colors';

type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  level: number;
  is_verified?: boolean;
  is_banned?: boolean;
  reports_count: number;
};

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  // Unverify user mutation
  const unverifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      try {
        // First ban the user
        const { data: bannedUser, error: banError } = await supabase
          .from('profiles')
          .update({ is_banned: true })
          .eq('id', userId)
          .select('name')
          .single();
        
        if (banError) throw banError;

        // Create a notification using service role client
        const { data: notification, error: notifError } = await supabase.auth.getSession().then(({ data: { session }}) => {
          const serviceRoleClient = supabase.rpc('admin_create_notification', {
            p_title: 'Account Banned',
            p_message: 'Your account has been banned due to violation of community guidelines. If you believe this is a mistake, please contact support.',
            p_user_id: userId
          });
          return serviceRoleClient;
        });

        if (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        return bannedUser;
      } catch (error) {
        console.error('Error banning user:', error);
        throw error;
      }
    },
    onError: (error) => {
      window.alert('Failed to ban user: ' + JSON.stringify(error));
    },
    onSuccess: (user) => {
      window.alert(`Successfully banned ${user?.name}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      try {
        // First unban the user
        const { data: unbannedUser, error: unbanError } = await supabase
          .from('profiles')
          .update({ is_banned: false })
          .eq('id', userId)
          .select('name')
          .single();
        
        if (unbanError) throw unbanError;

        // Create a notification using service role client
        const { data: notification, error: notifError } = await supabase.auth.getSession().then(({ data: { session }}) => {
          const serviceRoleClient = supabase.rpc('admin_create_notification', {
            p_title: 'Account Restored',
            p_message: 'Your account has been restored. You can now access all features of the platform.',
            p_user_id: userId
          });
          return serviceRoleClient;
        });

        if (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        return unbannedUser;
      } catch (error) {
        console.error('Error unbanning user:', error);
        throw error;
      }
    },
    onError: (error) => {
      window.alert('Failed to unban user: ' + JSON.stringify(error));
    },
    onSuccess: (user) => {
      window.alert(`Successfully unbanned ${user?.name}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', searchQuery],
    queryFn: async () => {
      // First get all users
      let query = supabase
        .from('profiles')
        .select('*');

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      // Then get reports count for each user using a subquery
      const { data: reports, error: reportsError } = await supabase
        .rpc('get_user_reports_count');
      if (reportsError) throw reportsError;

      // Map reports count to users
      const reportsMap = new Map(
        reports?.map((r: { reported_user_id: string; count: number }) => 
          [r.reported_user_id, r.count]
        ) || []
      );
      
      return profiles.map(user => ({
        ...user,
        reports_count: reportsMap.get(user.id) || 0
      })) as User[];
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(167, 139, 250, 0.3)', // Soft purple overlay
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          elevation: 5,
          pointerEvents: 'auto',
        }}>
          <View style={{
            backgroundColor: '#F3E8FF', // Light purple background
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            margin: 20,
            zIndex: 10000,
            elevation: 6,
            shadowColor: '#C084FC', // Purple shadow
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            borderWidth: 1,
            borderColor: '#E9D5FF', // Light purple border
          }}>
            <Text style={{
              fontSize: 22,
              fontWeight: '600',
              marginBottom: 12,
              color: confirmDialog.title.includes('Ban') ? '#E11D48' : '#059669',
              textAlign: 'center',
            }}>{confirmDialog.title}</Text>
            <Text style={{
              fontSize: 16,
              color: '#4B5563',
              marginBottom: 24,
              lineHeight: 24,
              textAlign: 'center',
            }}>{confirmDialog.message}</Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 16,
            }}>
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: '#F1F5F9',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
                onPress={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              >
                <Text style={{
                  fontSize: 16,
                  color: '#64748B',
                  fontWeight: '500',
                }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: confirmDialog.title.includes('Ban') ? '#FEE2E2' : '#DCFCE7',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: confirmDialog.title.includes('Ban') ? '#FECACA' : '#BBF7D0',
                }}
                onPress={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: confirmDialog.title.includes('Ban') ? '#DC2626' : '#059669',
                  fontWeight: '600',
                }}>{confirmDialog.title.includes('Ban') ? 'Ban User' : 'Unban User'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Users List */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView style={styles.usersList}>
          {users?.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.userUsername}>@{user.username}</Text>
                  <Text style={[styles.badge, user.role === 'admin' && styles.adminBadge]}>
                    {user.role}
                  </Text>
                  <Text style={styles.levelBadge}>Level {user.level}</Text>
                  {user.reports_count > 0 && (
                    <Text style={[styles.badge, styles.warningBadge]}>
                      {user.reports_count} reports
                    </Text>
                  )}
                  {user.is_banned && (
                    <Text style={[styles.badge, styles.errorBadge]}>
                      Banned
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.actions}>
                {user.role !== 'admin' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.verifyButton]}
                      onPress={() => {
                        if (user.is_verified) {
                          unverifyUserMutation.mutate(user.id);
                        } else {
                          verifyUserMutation.mutate(user.id);
                        }
                      }}
                    >
                      {user.is_verified ? (
                        <UserX size={20} color={colors.error} />
                      ) : (
                        <UserCheck size={20} color={colors.success} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, user.is_banned ? styles.unbanButton : styles.banButton]}
                      onPress={() => {
                        if (user.is_banned) {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Unban User',
                            message: `Are you sure you want to unban ${user.name}?\n\nThis will:\n• Allow them to access the platform again\n• Reset their ban status\n• Allow them to interact with other users`,
                            onConfirm: () => unbanUserMutation.mutate(user.id)
                          });
                        } else {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Ban User',
                            message: `Are you sure you want to ban ${user.name}?\n\nThis will:\n• Prevent them from accessing the platform\n• Hide their content\n• Block their interactions\n\nReason for ban: ${user.reports_count} reports`,
                            onConfirm: () => banUserMutation.mutate(user.id)
                          });
                        }
                      }}
                    >
                      {user.is_banned ? (
                        <Shield size={20} color={colors.success} />
                      ) : (
                        <Ban size={20} color={colors.error} />
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userUsername: {
    fontSize: 14,
    color: colors.textTertiary,
    marginRight: 12,
  },
  badge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
  },
  adminBadge: {
    backgroundColor: colors.primary + '20',
    color: colors.primary,
  },
  warningBadge: {
    backgroundColor: colors.warning + '20',
    color: colors.warning,
  },
  errorBadge: {
    backgroundColor: colors.error + '20',
    color: colors.error,
  },
  levelBadge: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: colors.success + '20',
  },
  banButton: {
    backgroundColor: colors.error + '20',
  },
  unbanButton: {
    backgroundColor: colors.success + '20',
  },
});
