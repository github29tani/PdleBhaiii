import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Plus, AlertCircle, MapPin, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useBookListings } from '@/hooks/useBookListings';
import { formatDistanceToNow } from 'date-fns';

export default function MyAdsScreen() {
  const router = useRouter();
  const { books, loading, error } = useBookListings({ onlyMyAds: true });

  const renderBookItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => router.push(`/book-bazaar/${item.id}`)}
    >
      {item.images?.[0]?.url ? (
        <Image 
          source={{ uri: item.images[0].url }} 
          style={styles.bookImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.bookImagePlaceholder}>
          <BookOpen size={32} color="#666" />
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.book?.title || 'Untitled Book'}
        </Text>
        <Text style={styles.bookPrice}>₹{item.price?.toLocaleString()}</Text>
        <View style={styles.bookMeta}>
          <Text style={styles.bookStatus}>
            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active'}
          </Text>
          <Text style={styles.postedAgo}>
            {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : ''}
          </Text>
        </View>
        <Text style={styles.bookLocation}>
          <MapPin size={12} color="#666" style={{ marginRight: 4 }} />
          {item.location || 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load your ads. Please try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Ads</Text>
      </View>
      
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.booksContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#5856D6" />
            <Text style={styles.emptyStateText}>You haven't posted any ads yet</Text>
            <Text style={styles.emptyStateSubtext}>Sell your books to other students</Text>
            <TouchableOpacity 
              style={styles.postAdButton}
              onPress={() => router.push('/book-bazaar/post-ad')}
            >
              <Text style={styles.postAdButtonText}>Post an Ad</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/book-bazaar/post-ad')}
      >
        <BookOpen size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000000',
  },
  errorText: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    margin: 16,
    marginBottom: 8,
  },
  booksContainer: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookImage: {
    width: 100,
    height: 140,
    backgroundColor: '#2a2a4a',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  bookImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  bookPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookStatus: {
    fontSize: 12,
    color: '#00E096',
    fontWeight: '600',
    backgroundColor: 'rgba(0, 224, 150, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  postedAgo: {
    fontSize: 12,
    color: '#a0a0ff',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bookLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 13,
    color: '#b8b8ff',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#b8b8ff',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  postAdButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  postAdButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    backgroundColor: '#000000',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
