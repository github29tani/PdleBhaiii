import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { getMessageThreads } from '@/lib/supabase/messages';
import { formatDistanceToNow } from 'date-fns';
import { Lock } from 'lucide-react-native';

export default function MessagesScreen() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadThreads();
    
    // Set up a refresh interval to check for new messages
    const refreshInterval = setInterval(() => {
      loadThreads(false);
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  const loadThreads = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await getMessageThreads();
      setThreads(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadThreads(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.threadItem}
      onPress={() => router.push(`/book-bazaar/messages/chat/${item.id}`)}
    >
      <Image 
        source={{ uri: item.other_participant?.avatar_url || 'https://via.placeholder.com/50' }} 
        style={styles.avatar}
      />
      <View style={styles.threadInfo}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName}>
            {item.other_participant?.name || 'Unknown User'}
          </Text>
          {item.last_message && (
            <Text style={styles.timeAgo}>
              {formatDistanceToNow(new Date(item.last_message.created_at), { addSuffix: true })}
            </Text>
          )}
        </View>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.book_listing?.book?.title || 'Unknown Book'}
        </Text>
        {item.last_message && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message.content}
          </Text>
        )}
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>
            {item.unread_count > 9 ? '9+' : item.unread_count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.encryptionContainer}>
          <Lock size={16} color="#a0a0ff" />
          <Text style={styles.encryptionText}>End-to-end encrypted</Text>
        </View>
      </View>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation by messaging a seller</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  encryptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  encryptionIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  encryptionText: {
    fontSize: 12,
    color: '#a0a0ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  listContent: {
    padding: 16,
  },
  threadItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a2e', // Dark purple background
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)', // Subtle purple border
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: '#2a2a4a', // Slightly lighter purple for avatar background
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
  },
  threadInfo: {
    flex: 1,
    marginRight: 8,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  threadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  timeAgo: {
    fontSize: 12,
    color: '#a0a0ff', // Light blue for timestamps
  },
  bookTitle: {
    fontSize: 14,
    color: '#b8b8ff', // Light purple for book title
    marginBottom: 4,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#e0e0ff', // Very light purple for message preview
    opacity: 0.9,
  },
  unreadBadge: {
    backgroundColor: '#007AFF', // Blue for unread badge to stand out
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
  },
});
