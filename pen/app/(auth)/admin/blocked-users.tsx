import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
// Simple loading component
const Loading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);
import { User, Shield, ShieldOff } from 'lucide-react-native';

type BlockedUser = {
  id: string;
  email: string;
  username: string;
  is_banned: boolean;
};

export default function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, is_banned')
        .eq('is_banned', true);

      if (error) throw error;
      
      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: false })
        .eq('id', userId);

      if (error) throw error;
      
      setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
      Alert.alert('Success', 'User has been unblocked');
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blocked Users</Text>
        <Text style={styles.subtitle}>{blockedUsers.length} blocked user(s)</Text>
      </View>

      {blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Shield size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No blocked users found</Text>
        </View>
      ) : (
        blockedUsers.map((user) => (
          <Card key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <User size={20} color={colors.text} />
                <Text style={styles.userName}>
                  {user.username || user.email.split('@')[0]}
                </Text>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.blockedDate}>
                Status: Banned
              </Text>
            </View>
            <TouchableOpacity
              style={styles.unblockButton}
              onPress={() => unblockUser(user.id)}
            >
              <ShieldOff size={16} color="white" style={styles.buttonIcon} />
              <Text style={styles.unblockButtonText}>Unblock</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  userCard: {
    marginBottom: 12,
    padding: 16,
  },
  userInfo: {
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  blockedDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reason: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 4,
  },
  reasonLabel: {
    fontWeight: '600',
  },
  unblockButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  unblockButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
