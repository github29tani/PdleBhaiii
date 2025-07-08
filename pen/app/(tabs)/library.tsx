import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookMarked, Download } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { NoteCard } from '@/components/NoteCard';
import { EmptyState } from '@/components/EmptyState';
import { LibraryTabs } from '@/components/LibraryTabs';
import { useAuthStore } from '@/store/auth-store';
import { useNotesStore } from '@/store/notes-store';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types';

const DownloadsPattern = () => (
  <View style={[styles.patternContainer, { opacity: 0.35 }]}>
    <View style={styles.pattern}>
      {/* Floating bubbles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <View
          key={`bubble-${i}`}
          style={[styles.shape, styles.bubble, {
            top: `${i * 10}%`,
            left: `${(i % 3) * 30 + 5}%`,
            backgroundColor: i % 2 === 0 ? '#9C27B0' : '#E040FB',
            transform: [{ scale: 0.8 + (i % 3) * 0.2 }]
          }]}
        />
      ))}
      
      {/* Stars */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={`star-${i}`}
          style={[styles.shape, styles.star, {
            top: `${i * 12 + 5}%`,
            left: `${(i % 3) * 30 + 10}%`,
            backgroundColor: '#7B1FA2',
            transform: [{ rotate: `${i * 45}deg` }]
          }]}
        />
      ))}
      
      {/* Circles with gradient borders */}
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={`circle-${i}`}
          style={[styles.shape, styles.gradientCircle, {
            top: `${i * 15 + 10}%`,
            right: `${i * 12 + 5}%`,
            borderColor: i % 2 === 0 ? '#BA68C8' : '#AB47BC'
          }]}
        />
      ))}
      
      {/* Diamond grid */}
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={`diamond-${i}`}
          style={[styles.shape, styles.diamond, {
            top: `${i * 25 + 15}%`,
            left: '50%',
            backgroundColor: '#CE93D8'
          }]}
        />
      ))}
    </View>
  </View>
);

const WishlistPattern = () => (
  <View style={styles.patternContainer}>
    <View style={styles.pattern}>
      {/* Left column */}
      <View style={[styles.shape, styles.circle, { top: '5%', left: '8%' }]} />
      <View style={[styles.shape, styles.square, { top: '25%', left: '12%' }]} />
      <View style={[styles.shape, styles.triangle, { top: '45%', left: '6%' }]} />
      <View style={[styles.shape, styles.zigzag, { top: '65%', left: '10%' }]} />
      <View style={[styles.shape, styles.circle, { top: '85%', left: '8%' }]} />
      
      {/* Left-center column */}
      <View style={[styles.shape, styles.triangle, { top: '15%', left: '28%' }]} />
      <View style={[styles.shape, styles.square, { top: '35%', left: '25%' }]} />
      <View style={[styles.shape, styles.zigzag, { top: '55%', left: '28%' }]} />
      <View style={[styles.shape, styles.circle, { top: '75%', left: '25%' }]} />
      
      {/* Center column */}
      <View style={[styles.shape, styles.zigzag, { top: '5%', left: '45%' }]} />
      <View style={[styles.shape, styles.circle, { top: '25%', left: '42%' }]} />
      <View style={[styles.shape, styles.square, { top: '45%', left: '45%' }]} />
      <View style={[styles.shape, styles.triangle, { top: '65%', left: '42%' }]} />
      <View style={[styles.shape, styles.zigzag, { top: '85%', left: '45%' }]} />
      
      {/* Right-center column */}
      <View style={[styles.shape, styles.square, { top: '15%', left: '62%' }]} />
      <View style={[styles.shape, styles.triangle, { top: '35%', left: '65%' }]} />
      <View style={[styles.shape, styles.circle, { top: '55%', left: '62%' }]} />
      <View style={[styles.shape, styles.zigzag, { top: '75%', left: '65%' }]} />
      
      {/* Right column */}
      <View style={[styles.shape, styles.triangle, { top: '5%', left: '82%' }]} />
      <View style={[styles.shape, styles.circle, { top: '25%', left: '85%' }]} />
      <View style={[styles.shape, styles.square, { top: '45%', left: '82%' }]} />
      <View style={[styles.shape, styles.zigzag, { top: '65%', left: '85%' }]} />
      <View style={[styles.shape, styles.triangle, { top: '85%', left: '82%' }]} />
    </View>
  </View>
);

export default function LibraryScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    bookmarkedNotes, 
    downloadedNotes,
    fetchBookmarkedNotes, 
    fetchDownloadedNotes,
    isLoading 
  } = useNotesStore();
  
  const [activeTab, setActiveTab] = useState<'downloads' | 'wishlist'>('downloads');
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotes();
    }
  }, [isAuthenticated, user?.id, activeTab]);
  
  const fetchNotes = async () => {
    try {
      console.log('Fetching notes for tab:', activeTab);
      if (activeTab === 'downloads') {
        await fetchDownloadedNotes();
      } else {
        await fetchBookmarkedNotes();
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };
  
  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.authPromptContainer}>
          <EmptyState
            title="Access Your Library"
            description="Log in to view your downloaded and bookmarked notes"
            actionLabel="Log In"
            onAction={() => router.push('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const renderContent = () => {
    if (isLoading) {
      console.log('Loading state:', { isLoading });
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      );
    }

    const notes = activeTab === 'downloads' ? downloadedNotes : bookmarkedNotes;
    console.log('Current notes:', { activeTab, notesCount: notes.length });
    
    if (notes.length === 0) {
      return (
        <EmptyState
          title={activeTab === 'downloads' ? "No Downloads Yet" : "No Bookmarks Yet"}
          description={
            activeTab === 'downloads' 
              ? "Your downloaded notes will appear here" 
              : "Your bookmarked notes will appear here"
          }
          icon={activeTab === 'downloads' ? <Download size={40} color={colors.textTertiary} /> : <BookMarked size={40} color={colors.textTertiary} />}
          actionLabel="Browse Notes"
          onAction={() => router.push('/')}
        />
      );
    }

    return (
      <FlatList
        data={notes}
        renderItem={({ item }) => <NoteCard note={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notesContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {activeTab === 'wishlist' ? <WishlistPattern /> : <DownloadsPattern />}
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>
      
      <LibraryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    overflow: 'hidden',
  },
  pattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shape: {
    position: 'absolute',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF4B81',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#00B4D8',
  },
  square: {
    width: 28,
    height: 28,
    backgroundColor: '#00B4D8',
    transform: [{ rotate: '45deg' }],
  },
  zigzag: {
    width: 30,
    height: 30,
    backgroundColor: '#FF4B81',
    transform: [{ rotate: '30deg' }],
    borderRadius: 6,
  },
  line: {
    width: 120,
    height: 3,
    transform: [{ rotate: '45deg' }],
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  hexagon: {
    width: 32,
    height: 18,
    borderRadius: 4,
    transform: [{ rotate: '30deg' }],
  },
  bubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.8,
  },
  star: {
    width: 24,
    height: 24,
    backgroundColor: '#7B1FA2',
  },
  gradientCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  diamond: {
    width: 30,
    height: 30,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  notesContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add extra padding at bottom
  }
});