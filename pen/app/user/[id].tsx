import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Alert, Platform, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Search, Sliders, MapPin, AlertCircle, X, ChevronDown, ChevronUp, Check, BookOpen } from 'lucide-react-native';
import { useNotesStore } from '@/store/notes-store';
import { BookOpenCheck, Briefcase } from 'lucide-react-native';
import { FlatList } from 'react-native';
import { BookCard } from '@/components/BookCard';
import { useFollowingStore } from '@/store/followers-store';
import { useBlockStore } from '@/store/block-store';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/constants/colors';
import { formatDistanceToNow } from 'date-fns';
// MapPin is already imported from the first lucide-react-native import
import { NoteCard } from '@/components/NoteCard';
import { User, UserCheck, UserPlus, MoreVertical, Twitter, Linkedin, Instagram, Github, Globe } from 'lucide-react-native';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { supabase } from '@/lib/supabase';

// Social media brand colors
const socialColors = {
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  instagram: '#E4405F',
  github: '#171515',
  website: '#2ECC71'
};

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  cover_image: string;
  edition: number;
  year: number;
  location: string;
}

export default function UserProfileScreen() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('notes');
  const { uploadedNotes, fetchUploadedNotes } = useNotesStore();
  const { user } = useAuthStore();
  const [books, setBooks] = useState<any[]>([]);
  const { followers, following, getFollowers, getFollowing, followUser, unfollowUser, isFollowing } = useFollowingStore();
  const { blockUser, unblockUser, isBlocked, getBlockedUsers } = useBlockStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState<'user' | 'note' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [authorFilter, setAuthorFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfile();
      getFollowers(id);
      getFollowing(id);
      fetchUploadedNotes(id);
      if (user?.id) {
        getFollowing(user.id);
        getBlockedUsers();
      }
    }
  }, [id, user?.id]);

  useEffect(() => {
    console.log('Profile check:', {
      userId: user?.id,
      profileId: id,
      isOwnProfile: user?.id === id
    });
  }, [user?.id, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    await getFollowers(id);
    await getFollowing(id);
    await fetchUploadedNotes(id);
    if (user?.id) {
      await getFollowing(user.id);
    }
    setRefreshing(false);
  };

  const loadProfile = async () => {
    if (!id) return;

    try {
      // Fetch profile, qualifications and experience concurrently
      const [
        { data: profileData, error: profileError },
        { data: qualData, error: qualError },
        { data: expData, error: expError }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase
          .from('user_qualifications')
          .select('qualification')
          .eq('user_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_experience')
          .select('experience')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
      ]);

      if (profileError) throw profileError;
      if (qualError) throw qualError;
      if (expError) throw expError;

      console.log('Raw data from Supabase:', {
        profileData,
        qualData,
        expData,
        hasQuals: !!qualData?.length,
        hasExp: !!expData?.length
      });

      const profileWithExtras = {
        ...profileData,
        qualifications: qualData?.map((q: any) => q.qualification) || [],
        experience: expData?.map((e: any) => e.experience) || []
      };
      
      console.log('Profile data loaded:', {
        profile: profileData,
        qualifications: profileWithExtras.qualifications,
        experience: profileWithExtras.experience,
        hasQuals: profileWithExtras.qualifications.length > 0,
        hasExp: profileWithExtras.experience.length > 0
      });
      
      setProfile(profileWithExtras);
    } catch (error) {
      console.error('Error fetching profile:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        id,
        isAuthenticated: !!user,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleFollowPress = async () => {
    if (!user) return;
    
    if (isFollowing(id)) {
      await unfollowUser(id);
    } else {
      await followUser(id);
    }
    await getFollowers(id);
    await getFollowing(id);
    if (user?.id) {
      await getFollowing(user.id);
    }
  };

  const handleReport = async (type: 'user' | 'note', reason: string) => {
    try {
      console.log('Submitting report:', { type, reason, userId: user?.id, reportedId: id });
      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user?.id,
          reported_id: id,
          type,
          reason,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting report:', error);
        throw error;
      }
      
      console.log('Report submitted successfully:', data);
      Alert.alert('Success', 'Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const showReportOptions = () => {
    console.log('showReportOptions called', {
      userId: user?.id,
      profileId: id,
      isOwnProfile: user?.id === id,
      isAuthenticated: !!user
    });

    if (!user) {
      Alert.alert('Error', 'Please login to report');
      return;
    }

    if (user?.id === id) {
      console.log('Cannot report own profile');
      return;
    }

    setIsReportModalVisible(true);
  };

  const handleReportOptionSelect = (type: 'user' | 'note') => {
    setReportType(type);
  };

  const handleReportReasonSelect = (reason: string) => {
    if (reportType) {
      handleReport(reportType, reason);
      setReportType(null);
      setIsReportModalVisible(false);
    }
  };

  const isOwnProfile = user?.id === id;
  const isUserFollowing = isFollowing(id);

  const fetchBooks = async () => {
    try {
      console.log('[UserProfile][fetchBooks] Starting book fetch for user:', id);
      
      // Get the user's book listings
      const { data: listings, error: listingsError } = await supabase
        .from('book_listings')
        .select(`
          *,
          books (
            id,
            title,
            author,
            description,
            subject,
            class_level,
            board_university
          ),
          book_images (
            url
          )
        `)
        .eq('seller_id', id)  // Changed from user_id to seller_id
        .order('created_at', { ascending: false });

      if (listingsError) {
        console.error('[UserProfile][fetchBooks] Error fetching listings:', listingsError);
        throw listingsError;
      }

      console.log('[UserProfile][fetchBooks] Raw listings:', {
        count: listings?.length,
        firstListing: listings?.[0]
      });

      // Transform the data to match BookCard component's expected structure
      const transformedBooks = listings?.map(listing => {
        if (!listing?.books) {
          console.warn('[UserProfile][fetchBooks] Listing missing book data:', listing);
          return null;
        }

        return {
          id: listing.id,
          book_id: listing.book_id,
          title: listing.books.title,
          author: listing.books.author,
          description: listing.books.description,
          subject: listing.books.subject,
          class_level: listing.books.class_level,
          board_university: listing.books.board_university,
          price: listing.price_inr || (listing.is_free ? 0 : listing.is_for_exchange ? 0 : 0),
          condition: listing.condition || 'good',
          is_free: listing.is_free,
          is_for_exchange: listing.is_for_exchange,
          cover_image: listing.book_images?.[0]?.url || 'https://via.placeholder.com/150',
          images: listing.book_images?.map(img => img.url) || [],
          location: listing.location || 'Location not specified',
          created_at: listing.created_at,
          contact_preference: listing.contact_preference,
          contact_phone: listing.contact_phone,
          contact_whatsapp: listing.contact_whatsapp
        };
      }).filter(Boolean) || [];

      console.log('[UserProfile][fetchBooks] Transformed books:', {
        totalBooks: transformedBooks.length,
        firstBook: transformedBooks[0]
      });

      setBooks(transformedBooks);

      console.log('[UserProfile][fetchBooks] Books state updated:', {
        booksCount: books.length,
        firstBookId: books[0]?.id,
        firstBookTitle: books[0]?.title
      });

      console.log('[UserProfile][fetchBooks] Query structure:', listings);

      if (listingsError) {
        console.error('[UserProfile][fetchBooks] Error:', listingsError);
        throw listingsError;
      }

      console.log('[UserProfile][fetchBooks] Books state updated:', {
        booksCount: transformedBooks.length,
        firstBookId: transformedBooks[0]?.id,
        firstBookTitle: transformedBooks[0]?.title
      });

    } catch (error) {
      console.error('[UserProfile][fetchBooks] Error fetching books:', error);
      Alert.alert('Error', 'Failed to load books');
    }
  };

  useEffect(() => {
    console.log('[UserProfile][useEffect] Books state changed:', {
      booksCount: books.length,
      firstBookId: books[0]?.id,
      firstBookTitle: books[0]?.title
    });
  }, [books]);

  useEffect(() => {
    fetchBooks();
  }, [id]);

  useEffect(() => {
    console.log('[UserProfile][useEffect] User ID changed:', id);
  }, [id]);

  const formatCondition = (condition: string) => {
    if (!condition) return 'N/A';
    return condition
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace('Like New', 'Like New');
  };

  const handleBookPress = async (book: any) => {
    router.push(`/book-bazaar/${book.id}`);
  };

  const handleLocationPress = (location: string) => {
    console.log('Location pressed:', location);
  };

  const handleConditionPress = (condition: string) => {
    console.log('Condition pressed:', condition);
  };

  const handleTitlePress = (title: string) => {
    console.log('Title pressed:', title);
  };

  const handleAuthorPress = (author: string) => {
    console.log('Author pressed:', author);
  };

  const handlePricePress = (price: number) => {
    console.log('Price pressed:', price);
  };

  const handleTimingPress = (createdAt: string) => {
    console.log('Timing pressed:', createdAt);
  };

  const handleBlockAction = async () => {
    if (isBlocking) return;
    
    try {
      setIsBlocking(true);
      if (isBlocked(id)) {
        await unblockUser(id);
      } else {
        await blockUser(id);
      }
      setShowBlockModal(false);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleBlockPress = () => {
    if (isBlocked(id)) {
      handleBlockAction();
    } else {
      setShowBlockModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: profile?.name || 'Profile',
          headerShadowVisible: false,
          headerStyle: { 
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontSize: 18,
          },
          headerRight: () => {
            console.log('Rendering header right:', {
              isOwnProfile: user?.id === id,
              userId: user?.id,
              profileId: id
            });
            if (user?.id === id) return null;
            
            return (
              <TouchableOpacity 
                style={[styles.moreButton]}
                onPress={() => {
                  console.log('More button pressed');
                  showReportOptions();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MoreVertical size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }
        }} 
      />



      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <User size={40} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{profile?.name}</Text>
              {profile?.username && (
                <Text style={styles.username}>@{profile.username}</Text>
              )}
            </View>
          </View>

          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
          
          {/* Social Media Links */}
          {(profile?.twitter_url || profile?.linkedin_url || profile?.instagram_url || profile?.github_url || profile?.website_url) && (
            <View style={styles.socialLinks}>
              {profile?.twitter_url && (
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: socialColors.twitter }]}
                  onPress={() => Linking.openURL(profile.twitter_url)}
                >
                  <Twitter size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {profile?.linkedin_url && (
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: socialColors.linkedin }]}
                  onPress={() => Linking.openURL(profile.linkedin_url)}
                >
                  <Linkedin size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {profile?.instagram_url && (
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: socialColors.instagram }]}
                  onPress={() => Linking.openURL(profile.instagram_url)}
                >
                  <Instagram size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {profile?.github_url && (
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: socialColors.github }]}
                  onPress={() => Linking.openURL(profile.github_url)}
                >
                  <Github size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {profile?.website_url && (
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: socialColors.website }]}
                  onPress={() => Linking.openURL(profile.website_url)}
                >
                  <Globe size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{followers.length}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{following.length}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{books.length}</Text>
              <Text style={styles.statLabel}>Books</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{uploadedNotes.length}</Text>
              <Text style={styles.statLabel}>Notes</Text>
            </TouchableOpacity>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isUserFollowing ? styles.followingButton : styles.notFollowingButton,
                  { width: '100%' } // Make follow button full width
                ]}
                onPress={handleFollowPress}
              >
                {isUserFollowing ? (
                  <>
                    <UserCheck size={20} color={colors.primary} />
                    <Text style={[styles.followButtonText, { color: colors.primary }]}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} color="#FFFFFF" />
                    <Text style={[styles.followButtonText, { color: '#FFFFFF' }]}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpenCheck size={20} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Qualifications</Text>
            </View>
            <View style={styles.sectionContent}>
              {profile?.qualifications?.length > 0 ? (
                profile.qualifications.map((q: string, idx: number) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.listItemText}>{q}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No qualifications added yet</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
            <View style={styles.sectionContent}>
              {profile?.experience?.length > 0 ? (
                profile.experience.map((exp: string, idx: number) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.listItemText}>{exp}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No experience added yet</Text>
              )}
            </View>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'notes' && styles.activeTab]}
              onPress={() => setActiveTab('notes')}
            >
              <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'books' && styles.activeTab]}
              onPress={() => setActiveTab('books')}
            >
              <Text style={[styles.tabText, activeTab === 'books' && styles.activeTabText]}>Books</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'notes' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BookOpenCheck size={20} color={colors.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Your Notes</Text>
              </View>
              <View style={styles.sectionContent}>
                <FlatList
                  data={uploadedNotes}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <NoteCard note={item} />}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <BookOpenCheck size={48} color={colors.primary} />
                      <Text style={styles.emptyStateText}>No notes uploaded yet</Text>
                      <Text style={styles.emptyStateSubtext}>Upload your first note to get started!</Text>
                    </View>
                  }
                />
              </View>
            </View>
          ) : (
            <FlatList
              data={books}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.bookCard}
                  onPress={() => handleBookPress(item)}
                >
                  {item.cover_image ? (
                    <Image 
                      source={{ uri: item.cover_image }} 
                      style={styles.bookImage} 
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.bookImagePlaceholder}>
                      <BookOpen size={32} color="#fff" />
                    </View>
                  )}
                  <View style={styles.bookContent}>
                    <View style={styles.bookHeader}>
                      <View style={styles.bookInfo}>
                        <Text style={styles.bookTitleText} numberOfLines={1}>
                          {item.title || 'Untitled Book'}
                        </Text>
                        <Text style={styles.bookAuthorText} numberOfLines={1}>
                          {item.author || 'Unknown Author'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bookMeta}>
                      <View style={styles.bookLeftMeta}>
                        <View style={styles.bookLocationContainer}>
                          <TouchableOpacity 
                            style={styles.bookLocationButton}
                            onPress={() => handleLocationPress(item.location)}
                          >
                            <MapPin size={12} color="#000" style={{ marginRight: 4 }} />
                            <Text style={styles.bookLocationText}>
                              {item.location || 'N/A'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.bookRightMeta}>
                        <View style={styles.bookPriceContainer}>
                          <TouchableOpacity 
                            style={styles.bookPriceButton}
                            onPress={() => handlePricePress(item.price)}
                          >
                            <Text style={styles.bookPriceText}>₹{item.price?.toLocaleString()}</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                          style={styles.bookTimingButton}
                          onPress={() => handleTimingPress(item.created_at)}
                        >
                          <Text style={styles.bookTimingText}>
                            {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : ''}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <BookOpen size={48} color="#fff" />
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 'No matching books found' : 'No books available yet'}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {searchQuery ? 'Try a different search term' : 'Check back later for new listings'}
                  </Text>
                </View>
              }
            />
          )}
        </View>

      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        currentName={profile?.name}
        currentBio={profile?.bio}
        currentAvatar={profile?.avatar_url}
        currentUsername={profile?.username}
        onUpdate={loadProfile}
      />

      <Modal
        visible={isReportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsReportModalVisible(false);
          setReportType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!reportType ? (
              <>
                <Text style={styles.modalTitle}>More Options</Text>
                <TouchableOpacity 
                  style={styles.reportOption}
                  onPress={() => handleReportOptionSelect('user')}
                >
                  <Text style={styles.reportOptionText}>Report User</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.reportOption}
                  onPress={() => handleReportOptionSelect('note')}
                >
                  <Text style={styles.reportOptionText}>Report Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.reportOption, styles.blockOption]}
                  onPress={handleBlockPress}
                >
                  <Text style={[styles.reportOptionText, styles.blockText]}>
                    {isBlocked(id) ? 'Unblock User' : 'Block User'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : reportType === 'user' ? (
              <>
                <Text style={styles.modalTitle}>Why are you reporting this user?</Text>
                {['Spam', 'Fake Account', 'Inappropriate Content', 'Harassment'].map((reason) => (
                  <TouchableOpacity 
                    key={reason}
                    style={styles.reportOption}
                    onPress={() => handleReportReasonSelect(reason.toLowerCase())}
                  >
                    <Text style={styles.reportOptionText}>{reason}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Why are you reporting these notes?</Text>
                {['Copyright Violation', 'Inappropriate Content', 'Spam'].map((reason) => (
                  <TouchableOpacity 
                    key={reason}
                    style={styles.reportOption}
                    onPress={() => handleReportReasonSelect(reason.toLowerCase())}
                  >
                    <Text style={styles.reportOptionText}>{reason}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <TouchableOpacity 
              style={[styles.reportOption, styles.cancelOption]}
              onPress={() => {
                setIsReportModalVisible(false);
                setReportType(null);
              }}
            >
              <Text style={[styles.reportOptionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={showBlockModal}
        title="Block User"
        message="Are you sure you want to block this user? You won't be able to see each other's posts or messages."
        confirmText="Block"
        isDestructive
        onConfirm={handleBlockAction}
        onCancel={() => setShowBlockModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bookCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  bookImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  bookImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookContent: {
    padding: 12,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'left',
  },
  bookAuthorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'left',
    flex: 1,
    marginTop: 4,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bookLeftMeta: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  bookLocationContainer: {
    marginTop: 4,
  },
  bookRightMeta: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  bookPriceContainer: {
    marginBottom: 4,
  },
  bookPriceButton: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 4,
  },
  bookPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bookTimingButton: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookTimingText: {
    fontSize: 12,
    color: '#fff',
  },
  bookLocationButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookLocationText: {
    fontSize: 14,
    color: '#fff',
  },
  bookStats: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#5856D6',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bio: {
    fontSize: 16,
    color: colors.text,
    marginTop: 12,
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.primary,
    height: 40,
  },
  followingButton: {
    backgroundColor: colors.background,
  },
  notFollowingButton: {
    backgroundColor: colors.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  blockedButton: {
    backgroundColor: '#FF4444',
  },
  notBlockedButton: {
    backgroundColor: '#FF4444',
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(0, 141, 204, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sectionContent: {
    paddingLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 10,
  },
  listItemText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 16,
  },
  notesGrid: {
    gap: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    marginTop: 8,
    marginLeft: 4,
  },
  cardsContainer: {
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    backgroundColor: 'rgba(0, 141, 204, 0.15)', // Light blue with opacity
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 141, 204, 0.3)', // Slightly darker blue border
  },
  cardText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  reportOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  reportOptionText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelOption: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text,
  },
  blockOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  blockText: {
    color: colors.error,
    fontWeight: '600',
  },
});
