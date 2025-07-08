import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { User } from '@/types';
import { Award, Search } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';

export default function VerificationsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuthStore();

  // Only admin users can access this screen
  const isAdmin = currentUser?.is_admin;

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: string, isVerified: boolean, reason?: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_verified: isVerified,
          verification_reason: reason || null,
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_verified: isVerified, verification_reason: reason || null }
          : user
      ));

      Alert.alert(
        'Success',
        isVerified ? 'User has been verified' : 'User verification has been removed'
      );
    } catch (error) {
      console.error('Error toggling verification:', error);
      Alert.alert('Error', 'Failed to update verification status');
    }
  };

  const handleVerify = (user: User) => {
    Alert.prompt(
      'Verify User',
      'Enter verification reason (e.g., "Verified Educator")',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: (reason) => {
            if (reason?.trim()) {
              toggleVerification(user.id, true, reason.trim());
            }
          },
        },
      ],
      'plain-text',
      user.verification_reason || ''
    );
  };

  const handleUnverify = (user: User) => {
    Alert.alert(
      'Remove Verification',
      'Are you sure you want to remove this user\'s verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleVerification(user.id, false),
        },
      ]
    );
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.unauthorizedText}>
          You do not have permission to access this page.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Manage Verifications',
          headerLargeTitle: true,
        }}
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.textTertiary} />}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item: user }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userUsername}>@{user.username}</Text>
              {user.is_verified && (
                <View style={styles.verificationReason}>
                  <Award size={14} color={colors.primary} />
                  <Text style={styles.reasonText}>{user.verification_reason}</Text>
                </View>
              )}
            </View>
            <Button
              variant={user.is_verified ? 'outline' : 'primary'}
              onPress={() => user.is_verified ? handleUnverify(user) : handleVerify(user)}
            >
              {user.is_verified ? 'Remove Verification' : 'Verify User'}
            </Button>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  unauthorizedText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  searchContainer: {
    padding: 16,
  },
  list: {
    padding: 16,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verificationReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 8,
  },
  reasonText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 14,
  },
});
