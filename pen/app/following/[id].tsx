import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { UserItem } from '@/components/UserItem';
import { useFollowingStore } from '@/store/followers-store';
import { User } from '@/types';

export default function FollowingScreen() {
  const { id } = useLocalSearchParams();
  const { following, getFollowing, clearState } = useFollowingStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
    // Clear state when component unmounts
    return () => {
      clearState();
    };
  }, [id]);

  const loadFollowing = async () => {
    setIsLoading(true);
    await getFollowing(id as string);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Following',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
        }} 
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Not following anyone yet</Text>
          <Text style={styles.emptySubtext}>Follow other users to see their notes in your feed!</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserItem
              id={item.id}
              name={item.name}
              username={item.username}
              avatar_url={item.avatar_url}
              bio={item.bio}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
});
