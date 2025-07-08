import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, BookOpen, ChevronRight, Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { NoteCard } from '@/components/NoteCard';
import { CategoryCard } from '@/components/CategoryCard';
import { EmptyState } from '@/components/EmptyState';
import { HomeTabs } from '@/components/HomeTabs';
import { useAuthStore } from '@/store/auth-store';
import { useNotesStore } from '@/store/notes-store';
import { mockCategories } from '@/mocks/categories';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    trendingNotes, 
    recommendedNotes, 
    fetchTrendingNotes, 
    fetchRecommendedNotes,
    isTrendingLoading,
    isRecommendedLoading
  } = useNotesStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'recommended'>('trending');
  
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      // Wait for session to be checked
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only load data if authenticated
      if (session?.user && isAuthenticated) {
        await loadData();
      }
    };
    
    checkAuthAndLoadData();
  }, [isAuthenticated]);
  
  const loadData = async () => {
    if (!isAuthenticated) return;
    
    await fetchTrendingNotes();
    
    // Get user's interests and subjects
    const { data: profile } = await supabase
      .from('profiles')
      .select('interests, subjects')
      .eq('id', user?.id)
      .single();
      
    const interests = profile?.interests ?? [];
    const subjects = profile?.subjects ?? [];
    
    // Combine interests and subjects for recommendations
    const allInterests = [...interests, ...subjects];
    if (allInterests.length > 0) {
      await fetchRecommendedNotes(allInterests);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // If not authenticated, show login prompt instead of redirecting
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.authPromptContainer}>
          <Text style={styles.authPromptTitle}>Welcome to PdleBhaii</Text>
          <Text style={styles.authPromptText}>Please log in or create an account to access study notes and more.</Text>
          <EmptyState
            title="Get Started"
            description="Log in to access your personalized study notes"
            actionLabel="Log In"
            onAction={() => router.push('/(auth)/login')}
            style={styles.emptyState}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Student'}</Text>
          <Text style={styles.subGreeting}>Find the perfect study notes</Text>
          {/* Debug information */}
          {__DEV__ && (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Debug - Admin status: {String(user?.is_admin)}
            </Text>
          )}
          {user?.is_admin && (
            <TouchableOpacity 
              style={styles.adminButton}
              onPress={() => router.push('/admin')}
            >
              <View style={styles.adminButtonContent}>
                <Text style={styles.adminButtonText}>Admin Dashboard</Text>
                <ChevronRight size={20} color={colors.background} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Subject</Text>
          <FlatList
            data={mockCategories}
            renderItem={({ item }) => <CategoryCard category={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>
        
        <View style={styles.section}>
          <HomeTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {activeTab === 'trending' ? (
            <>
              {isTrendingLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading trending notes...</Text>
                </View>
              ) : trendingNotes.length === 0 ? (
                <EmptyState
                  title="No trending notes yet"
                  description="Be the first to upload study notes and start a trend!"
                  icon={<TrendingUp size={40} color={colors.textTertiary} />}
                  actionLabel="Upload Notes"
                  onAction={() => router.push('/upload')}
                />
              ) : (
                <View style={styles.notesContainer}>
                  {trendingNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              {isRecommendedLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading recommendations...</Text>
                </View>
              ) : recommendedNotes.length === 0 ? (
                <EmptyState
                  title="No recommendations yet"
                  description="Update your interests in profile to get personalized recommendations"
                  icon={<BookOpen size={40} color={colors.textTertiary} />}
                  actionLabel="Update Interests"
                  onAction={() => router.push('/profile')}
                />
              ) : (
                <View style={styles.notesContainer}>
                  {recommendedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    paddingBottom: 80, // Add extra padding for tab bar
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  notesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  categoriesContainer: {
    paddingVertical: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyState: {
    width: '100%',
    maxWidth: 300,
  },
  authButtonsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  adminButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  adminButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});