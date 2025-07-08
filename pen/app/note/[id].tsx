import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Linking,
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  Platform,
  Share
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Heart, Download, MessageSquare, Bookmark, BookmarkCheck, Share2, ArrowLeft, FileText, Maximize2, Minimize2, Trash2, ThumbsDown, Search, ChevronUp, ChevronDown, Plus, Minus, ArrowRight, MoreVertical } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';

import { NoteDownloadButton } from '@/components/NoteDownloadButton';
import { useNotesStore } from '@/store/notes-store';
import { useFollowingStore } from '@/store/followers-store';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types';
import { AdModal } from '@/components/AdModal';

const ReviewModal = ({ visible, onClose, onSubmit }: { visible: boolean, onClose: () => void, onSubmit: (rating: number, comment: string) => void }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return; // Require a rating
    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, setRating?: (rating: number) => void) => {
    return (
      <View style={{ flexDirection: 'row', marginVertical: 16, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={setRating ? () => setRating(star) : undefined}
            activeOpacity={0.7}
          >
            <Text style={{ 
              fontSize: 40, 
              color: star <= rating ? '#FFD700' : '#CCCCCC',
              marginHorizontal: 4,
            }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate this note</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.ratingLabel}>Tap to rate</Text>
          {renderStars(rating, setRating)}
          
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ReviewsSection = () => {
  const { id: noteId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState('latest');
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userReview, setUserReview] = useState<any>(null);

  // Fetch reviews from Supabase
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      
      // Get note's current rating and review count
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select('average_rating, review_count')
        .eq('id', noteId)
        .single();

      if (noteError) throw noteError;

      // Get reviews with user info
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('note_id', noteId);

      // Apply sorting
      if (filter === 'highest') {
        query = query.order('rating', { ascending: false });
      } else if (filter === 'lowest') {
        query = query.order('rating', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: reviewsData, error: reviewsError } = await query;
      
      if (reviewsError) throw reviewsError;

      setReviews(reviewsData || []);
      setAverageRating(noteData.average_rating || 0);
      setTotalReviews(noteData.review_count || 0);

      // Check if current user has already reviewed
      if (user) {
        const { data: userReviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('note_id', noteId)
          .eq('user_id', user.id)
          .single();
        
        setUserReview(userReviewData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (noteId) {
      fetchReviews();
    }
    
    // Handle screen dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription.remove();
  }, [noteId, filter]);

  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={{ 
            color: star <= rating ? '#FFD700' : '#CCCCCC',
            fontSize: 18,
            marginRight: 2
          }}>★</Text>
        ))}
      </View>
    );
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to leave a review');
      return;
    }

    try {
      setIsLoading(true);
      
      // First, get the user's profile to ensure we have their real name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Create a new review with the user's real name from profiles
      const { error } = await supabase
        .from('reviews')
        .insert([{
          note_id: noteId,
          user_id: user.id,
          user_name: profile.name || user.email?.split('@')[0] || 'User',
          user_avatar: profile.avatar_url,
          rating,
          comment: comment || null
        }]);

      if (error) throw error;
      
      Alert.alert('Success', 'Thank you for your review!');
      
      // Refresh reviews to get updated data
      await fetchReviews();
      
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.reviewsContainer}>
      <ReviewModal
        visible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        onSubmit={handleSubmitReview}
      />
      
      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>Reviews</Text>
      </View>
      
      <View style={styles.ratingOverview}>
        <View style={styles.ratingLeft}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.writeReviewButton}
          onPress={() => setIsReviewModalVisible(true)}
        >
          <Text style={styles.writeReviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterContainer}
      >
        {['Latest', 'Highest Rated', 'Lowest Rated', 'Most Helpful'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterButton,
              item === 'Latest' && styles.filterButtonActive
            ]}
            onPress={() => setFilter(item.toLowerCase().replace(' ', ''))}
          >
            <Text style={[
              styles.filterButtonText,
              item === 'Latest' && styles.filterButtonTextActive
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {reviews.length === 0 ? (
        <View style={styles.noReviews}>
          <Text style={styles.noReviewsText}>No reviews yet</Text>
          <TouchableOpacity 
            style={styles.firstReviewButton}
            onPress={() => setIsReviewModalVisible(true)}
          >
            <Text style={styles.firstReviewButtonText}>Write the first review</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <TouchableOpacity 
                  onPress={() => router.push(`/user/${review.user_id}`)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: review.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.user_name || 'U') + '&background=random' }}
                    style={styles.reviewAvatar}
                  />
                </TouchableOpacity>
                <View>
                  <TouchableOpacity 
                    onPress={() => router.push(`/user/${review.user_id}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reviewAuthor}>{review.user_name || 'Anonymous'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                {[...Array(5)].map((_, i) => (
                  <Text 
                    key={i} 
                    style={{
                      color: i < review.rating ? '#FFD700' : '#CCCCCC',
                      fontSize: 16,
                      marginRight: 2
                    }}
                  >
                    ★
                  </Text>
                ))}
              </View>
              {review.comment ? (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default function NoteDetailScreen() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [dimensions, setDimensions] = useState({ width: screenWidth, height: screenHeight });
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toggleBookmark, toggleLike, toggleDislike, deleteNote } = useNotesStore();
  const { followUser, unfollowUser, currentUserFollowing } = useFollowingStore();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [note, setNote] = useState<Note | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pageChangeCount, setPageChangeCount] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const isOwner = note?.uploaderId === session?.user?.id;

  const handleAdComplete = () => {
    // After ad is complete, trigger the download
    handleDownload();
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportReasonModal, setShowReportReasonModal] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [showBlockUserModal, setShowBlockUserModal] = useState(false);
  const [reportType, setReportType] = useState<string>();

  // Check if the current user has blocked the note's uploader
  const checkBlockStatus = async () => {
    if (!session?.user?.id || !note?.uploaderId) return;
    
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', session.user.id)
        .eq('blocked_id', note.uploaderId)
        .single();

      if (!error && data) {
        setIsUserBlocked(true);
      } else {
        setIsUserBlocked(false);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  // Check block status when note or session changes
  useEffect(() => {
    if (note?.uploaderId && session?.user?.id) {
      checkBlockStatus();
    }
  }, [note, session]);

  const handleMorePress = () => {
    setShowReportModal(true);
  };

  const handleReportTypeSelect = (type: string) => {
    setReportType(type);
    setShowReportModal(false);
    setShowReportReasonModal(true);
  };

  // Handle unblock user
  const handleUnblockUser = async () => {
    if (!session?.user?.id || !note?.uploaderId) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', session.user.id)
        .eq('blocked_id', note.uploaderId);

      if (error) throw error;

      setIsUserBlocked(false);
      setShowBlockUserModal(false);
      
      Alert.alert(
        'User Unblocked',
        'You have successfully unblocked this user. You will now see their content.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user. Please try again.');
    }
  };

  // Handle block user
  const handleBlockUser = async () => {
    console.log('[Block User] Starting block user process');
    console.log('[Block User] Current user ID:', session?.user?.id);
    console.log('[Block User] User to block ID:', note?.uploaderId);

    if (!session?.user?.id || !note?.uploaderId) {
      console.error('[Block User] Error: User not authenticated or invalid user to block');
      Alert.alert('Error', 'You must be logged in to block users.');
      return;
    }

    if (session.user.id === note.uploaderId) {
      console.warn('[Block User] User attempted to block themselves');
      Alert.alert('Error', 'You cannot block yourself.');
      return;
    }

    try {
      console.log('[Block User] Attempting to block user in database');
      const { data, error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: session.user.id,
          blocked_id: note.uploaderId,
          created_at: new Date().toISOString()
        })
        .select();

      console.log('[Block User] Database response:', { data, error });

      if (error) {
        if (error.code === '23505') { // Unique violation (already blocked)
          console.log('[Block User] User was already blocked');
          Alert.alert(
            'Already Blocked',
            'This user is already in your blocked list. You will not see their content.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setShowBlockUserModal(false);
                  router.back();
                }
              }
            ]
          );
          return;
        }
        console.error('[Block User] Database error:', error);
        throw error;
      }

      console.log('[Block User] Successfully blocked user, updating UI');
      setIsUserBlocked(true);
      setShowBlockUserModal(false);
      
      console.log('[Block User] Showing success message');
      Alert.alert(
        'User Blocked', 
        'You have successfully blocked this user. You will no longer see their content.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('[Block User] Navigating back after successful block');
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Block User] Error in block user process:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    }
  };

  const handleReport = async (type: string, description?: string) => {
    console.log('Report handler called');
    console.log('Report details:', { type, description, noteId: note?.id });
    
    if (!session?.user?.id) {
      console.log('No session, redirecting to login');
      router.push('/login');
      return;
    }
    if (!note?.id) {
      console.log('No note ID found');
      return;
    }

    try {
      console.log('Attempting to submit report for note:', note.id);
      const { error } = await supabase
        .from('reports')
        .insert({
          note_id: note.id,
          user_id: session.user.id,
          type,
          description,
          status: 'pending'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('Report submitted successfully');
      Alert.alert('Thank You', 'Your report has been submitted. We will review it shortly and take appropriate action.');
    } catch (error) {
      console.error('Error reporting note:', error);
      console.log('Full error details:', JSON.stringify(error));
      Alert.alert('Error', 'Failed to submit report. Please try again later.');
    }
    console.log('Report handler completed');
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: userSession } } = await supabase.auth.getSession();
      setSession(userSession);
      if (userSession?.user) {
        await useFollowingStore.getState().getFollowing(userSession.user.id);
      }
    };
    getSession();
  }, []);
  
  useEffect(() => {
    if (id) {
      fetchNote();
    }
    
    // Handle screen dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription.remove();
  }, [id]);

  useEffect(() => {
    if (note?.uploaderId && currentUserFollowing) {
      const isUserFollowed = currentUserFollowing.some(f => f.id === note.uploaderId);
      setIsFollowing(isUserFollowed);
    }
  }, [note?.uploaderId, currentUserFollowing]);

  const handleFollowToggle = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!note?.uploaderId) return;

    try {
      if (isFollowing) {
        await unfollowUser(note.uploaderId);
      } else {
        await followUser(note.uploaderId);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to toggle follow status.');
    }
  };

  const fetchNote = async () => {
    try {
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select(`
          *,
          uploader:uploader_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
        
      if (noteError) {
        if (noteError.code === 'PGRST116') {
          // Note was not found (likely deleted)
          router.replace('/(tabs)');
          return;
        }
        throw noteError;
      }
      
      // Get user's reaction to this note
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      let isLiked = false;
      let isDisliked = false;
      
      if (userId) {
        const { data: reaction } = await supabase
          .from('note_reactions')
          .select('reaction_type')
          .eq('user_id', userId)
          .eq('note_id', id)
          .single();
          
        if (reaction) {
          isLiked = reaction.reaction_type === 'like';
          isDisliked = reaction.reaction_type === 'dislike';
        }
      }
      
      if (noteData) {
        // Transform the data to match our Note type
        const transformedNote: Note = {
          id: noteData.id,
          title: noteData.title,
          description: noteData.description,
          subject: noteData.subject,
          class: noteData.class,
          board: noteData.board,
          topic: noteData.topic,
          fileType: noteData.file_type,
          fileUrl: noteData.file_url,
          thumbnailUrl: noteData.thumbnail_url,
          uploaderId: noteData.uploader_id,
          uploaderName: noteData.uploader?.name || 'Unknown',
          uploaderAvatar: noteData.uploader?.avatar_url || '/default-avatar.png',
          likes: noteData.likes || 0,
          downloads: noteData.downloads || 0,
          comments: noteData.comments || 0,
          views: noteData.views || 0,
          adClicks: noteData.ad_clicks || 0,
          earnings: noteData.earnings || 0,
          isLiked,
          isDisliked,
          isBookmarked: false,
          createdAt: noteData.created_at,
          preview_url: noteData.preview_url,
        };
        setNote(transformedNote);
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchThumbnailUrl = async () => {
    if (!note?.id) {
      console.log('fetchThumbnailUrl: No note ID available');
      return null;
    }
    
    // First check if we already have a preview URL in the note data
    if (note.preview_url) {
      console.log('fetchThumbnailUrl: Using preview URL from note data');
      return note.preview_url;
    }
    
    // Fall back to thumbnail URL if available
    if (note.thumbnail_url) {
      console.log('fetchThumbnailUrl: Using thumbnail URL as fallback');
      return note.thumbnail_url;
    }
    
    // If no preview or thumbnail URL is available, try to construct one
    console.log(`fetchThumbnailUrl: Trying to find preview for note ${note.id}`);
    
    try {
      // First, check if there are any files in the previews bucket for this note
      const { data: previewFiles, error: listError } = await supabase
        .storage
        .from('previews')
        .list(note.id);
      
      if (listError) {
        console.error('fetchThumbnailUrl: Error listing preview files:', listError);
      } else if (previewFiles && previewFiles.length > 0) {
        // Sort by created_at to get the most recent preview
        const sortedPreviews = [...previewFiles].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Get the most recent preview
        const latestPreview = sortedPreviews[0];
        const previewPath = `${note.id}/${latestPreview.name}`;
        
        // Get public URL for the preview
        const { data: { publicUrl } } = supabase.storage
          .from('previews')
          .getPublicUrl(previewPath);
        
        if (publicUrl) {
          console.log(`fetchThumbnailUrl: Found preview in previews bucket: ${publicUrl}`);
          
          // Update the note with the preview URL for future use
          try {
            await supabase
              .from('notes')
              .update({ preview_url: publicUrl })
              .eq('id', note.id);
            console.log('fetchThumbnailUrl: Updated note with preview URL');
          } catch (updateError) {
            console.error('fetchThumbnailUrl: Error updating note with preview URL:', updateError);
          }
          
          return publicUrl;
        }
      }
      
      // If no preview found in previews bucket, check the notes bucket
      console.log('fetchThumbnailUrl: No preview found in previews bucket, checking notes bucket');
      
      const { data: noteFiles, error: noteListError } = await supabase
        .storage
        .from('notes')
        .list(note.id);
      
      if (noteListError) {
        console.error('fetchThumbnailUrl: Error listing note files:', noteListError);
      } else if (noteFiles && noteFiles.length > 0) {
        // Look for a preview image in the note's folder
        const previewFile = noteFiles.find(file => 
          file.name.toLowerCase().includes('preview') && 
          (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png'))
        );
        
        if (previewFile) {
          const previewPath = `${note.id}/${previewFile.name}`;
          
          // Get public URL for the preview
          const { data: { publicUrl } } = supabase.storage
            .from('notes')
            .getPublicUrl(previewPath);
          
          if (publicUrl) {
            console.log(`fetchThumbnailUrl: Found preview in notes bucket: ${publicUrl}`);
            return publicUrl;
          }
        }
      }
      
      // If we reach here, no preview was found
      console.log('fetchThumbnailUrl: No preview image found in any bucket');
      return null;
      
    } catch (error) {
      console.error('fetchThumbnailUrl: Unexpected error:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    if (!note?.fileUrl) return;
    
    try {
      setIsDownloading(true);
      
      // On web, open in new tab
      if (Platform.OS === 'web') {
        window.open(note.fileUrl, '_blank');
      } else {
        // On mobile, open with system viewer
        const supported = await Linking.canOpenURL(note.fileUrl);
        if (supported) {
          await Linking.openURL(note.fileUrl);
        } else {
          throw new Error('Cannot open URL');
        }
      }
      
      // Update download count
      const { error } = await supabase
        .from('notes')
        .update({ downloads: (note.downloads || 0) + 1 })
        .eq('id', note.id);
        
      if (error) throw error;
      
      setNote(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);
    } catch (error) {
      console.error('Error opening file:', error);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleBookmark = () => {
    if (note) {
      toggleBookmark(note.id);
    }
  };
  
  const handleLike = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    await toggleLike(id);
  };

  const handleDislike = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    await toggleDislike(id);
    setIsDisliked(!isDisliked);
  };

  const handleDelete = async () => {
    console.log('Delete button clicked');
    console.log('Current note:', note);
    console.log('Current session:', session);
    console.log('Is owner?', isOwner);

    if (!note) {
      console.log('No note to delete');
      return;
    }

    if (!session?.user) {
      console.log('No user session');
      Alert.alert('Error', 'You must be logged in to delete notes.');
      return;
    }

    if (!isOwner) {
      console.log('User is not the owner');
      Alert.alert('Error', 'You can only delete your own notes.');
      return;
    }

    // Use Platform-specific alert
    if (Platform.OS === 'web') {
      console.log('Showing web confirmation');
      if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        try {
          console.log('Starting delete process...');
          setIsDeleting(true);
          console.log('Calling deleteNote with ID:', note.id);
          await deleteNote(note.id);
          console.log('Note deleted successfully');
          router.back();
        } catch (error) {
          console.error('Failed to delete note:', error);
          Alert.alert('Error', 'Failed to delete note. Please try again.');
        } finally {
          setIsDeleting(false);
        }
      } else {
        console.log('Delete cancelled');
      }
    } else {
      console.log('Showing mobile confirmation');
      Alert.alert(
        'Delete Note',
        'Are you sure you want to delete this note? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled'),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('Starting delete process...');
                setIsDeleting(true);
                console.log('Calling deleteNote with ID:', note.id);
                await deleteNote(note.id);
                console.log('Note deleted successfully');
                router.back();
              } catch (error) {
                console.error('Failed to delete note:', error);
                Alert.alert('Error', 'Failed to delete note. Please try again.');
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setPageChangeCount(prev => prev + 1);
  };

  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(1);
  const pdfViewerRef = useRef<WebView>(null);

  const handlePreviewPress = async () => {
    console.log('handlePreviewPress: Preview button pressed');
    
    if (!note?.fileUrl) {
      console.warn('handlePreviewPress: No file URL available');
      return;
    }
    
    // First, try to get a thumbnail preview for any file type
    console.log('handlePreviewPress: Attempting to fetch thumbnail preview');
    const thumbnailUrl = await fetchThumbnailUrl();
    
    if (thumbnailUrl) {
      console.log(`handlePreviewPress: Thumbnail URL found: ${thumbnailUrl}`);
      setPreviewImageUrl(thumbnailUrl);
      setShowImagePreview(true);
      return;
    }
    
    // If no thumbnail is available, handle based on file type
    if (note.fileType === 'pdf') {
      if (Platform.OS === 'web') {
        console.log('handlePreviewPress: No thumbnail available, opening PDF in new tab');
        window.open(note.fileUrl, '_blank');
      } else {
        console.log('handlePreviewPress: No thumbnail available, showing PDF preview');
        setShowPdfPreview(true);
        setCurrentPdfPage(1);
      }
    } else {
      console.log('handlePreviewPress: No thumbnail available, opening file directly');
      if (Platform.OS === 'web') {
        window.open(note.fileUrl, '_blank');
      } else {
        Linking.openURL(note.fileUrl);
      }
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Check out this note: ${note?.title} on StudySphere`;
      const shareUrl = `https://studysphere.app/note/${id}`;
      
      const result = await Share.share({
        message: shareMessage,
        url: shareUrl,
        title: note?.title
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Shared with activity type: ${result.activityType}`);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dialog dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share note. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading note details...</Text>
      </View>
    );
  }
  
  if (!note) {
    return (
      <SafeAreaView style={[styles.container, { width: screenWidth, height: screenHeight }]} edges={['top']}>
        <Text style={styles.errorTitle}>Note not found</Text>
        <Text style={styles.errorText}>The note you're looking for doesn't exist or has been removed.</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          style={styles.errorButton}
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { width: screenWidth, height: screenHeight }]} edges={['top']}>
      <Stack.Screen 
        options={{
          title: note.subject,
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Share2 size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={!isFullscreen}>
        {!isFullscreen && (
          <>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => router.push(`/user/${note?.uploaderId}`)}
              activeOpacity={0.7}
            >
              <Image
                source={{ 
                  uri: note?.uploaderAvatar || 'https://api.dicebear.com/7.x/avatars/svg?seed=' + note?.uploaderId 
                }}
                style={styles.avatar}
              />
              <Text style={styles.uploaderName}>{note?.uploaderName}</Text>
              <View style={styles.userActions}>
                <View style={styles.userActionsLeft}>
                  {!isOwner && (
                    <TouchableOpacity 
                      style={[styles.followButton, isFollowing && styles.followingButton]} 
                      onPress={handleFollowToggle}
                    >
                      <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.actions}>
                  {isOwner && (
                    <TouchableOpacity 
                      style={[styles.editButton]} 
                      onPress={() => router.push(`/(tabs)/upload?id=${id}`)}
                    >
                      <FileText size={24} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionButton, isOwner && { marginRight: 10 }]} 
                    onPress={handleMorePress}
                  >
                    <MoreVertical size={24} color={colors.gray} />
                  </TouchableOpacity>
                </View>

                {/* Report Modal */}
                <Modal
                  visible={showReportModal}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowReportModal(false)}
                >
                  <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowReportModal(false)}
                  >
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>What would you like to do?</Text>
                      
                      <TouchableOpacity 
                        style={styles.modalButton}
                        onPress={() => handleReportTypeSelect('user')}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.error }]}>Report User</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.modalButton}
                        onPress={() => handleReportTypeSelect('note')}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.error }]}>Report Note</Text>
                      </TouchableOpacity>

                      {note?.uploaderId && note.uploaderId !== session?.user?.id && (
                        <TouchableOpacity 
                          style={[styles.modalButton, { 
                            borderColor: isUserBlocked ? colors.primary : colors.error,
                            backgroundColor: isUserBlocked ? 'transparent' : 'transparent'
                          }]}
                          onPress={() => {
                            setShowReportModal(false);
                            if (isUserBlocked) {
                              handleUnblockUser();
                            } else {
                              setShowBlockUserModal(true);
                            }
                          }}
                        >
                          <Text style={[styles.modalButtonText, { 
                            color: isUserBlocked ? colors.primary : colors.error 
                          }]}>
                            {isUserBlocked ? 'Unblock User' : 'Block User'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowReportModal(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>

                {/* Report Reason Modal */}
                <Modal
                  visible={showReportReasonModal}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowReportReasonModal(false)}
                >
                  <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowReportReasonModal(false)}
                  >
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Why are you reporting this {reportType === 'user' ? 'user' : 'note'}?</Text>
                      
                      <TouchableOpacity 
                        style={styles.modalButton}
                        onPress={() => {
                          setShowReportReasonModal(false);
                          handleReport(reportType || '', 'inappropriate_content');
                        }}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.error }]}>Inappropriate Content</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.modalButton}
                        onPress={() => {
                          setShowReportReasonModal(false);
                          handleReport(reportType || '', 'spam');
                        }}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.error }]}>Spam</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.modalButton}
                        onPress={() => {
                          setShowReportReasonModal(false);
                          handleReport(reportType || '', 'copyright');
                        }}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.error }]}>Copyright Violation</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.modalButton}
                        onPress={() => {
                          setShowReportReasonModal(false);
                          handleReport(reportType || '', 'other');
                        }}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.error }]}>Other</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowReportReasonModal(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>

                {/* Block User Confirmation Modal */}
                <Modal
                  visible={showBlockUserModal}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowBlockUserModal(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Block User</Text>
                      <Text style={styles.modalText}>
                        Are you sure you want to block this user? You won't see their notes anymore.
                      </Text>
                      <View style={styles.modalButtonGroup}>
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.cancelButton, {flex: 1, marginRight: 8}]}
                          onPress={() => setShowBlockUserModal(false)}
                        >
                          <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.modalButton, {flex: 1, backgroundColor: colors.error, borderColor: colors.error}]}
                          onPress={handleBlockUser}
                        >
                          <Text style={[styles.modalButtonText, {color: '#fff'}]}>Block</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>
            </TouchableOpacity>
            <View style={styles.content}>
              <Text style={styles.title}>{note?.title}</Text>
              <Text style={styles.description}>{note?.description}</Text>
              
              <View style={styles.metaContainer}>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{note?.subject}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.secondaryLight }]}>
                  <Text style={[styles.badgeText, { color: colors.secondary }]}>{note?.class}</Text>
                </View>
                {note?.board && (
                  <View style={[styles.badge, { backgroundColor: colors.secondaryLight }]}>
                    <Text style={[styles.badgeText, { color: colors.info }]}>{note?.board}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
        
        {note?.fileType === 'pdf' && (
          <View style={[styles.pdfContainer, isFullscreen && styles.pdfContainerFullscreen]}>
            {Platform.OS === 'web' ? (
              <>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 size={24} color={colors.background} />
                  ) : (
                    <Maximize2 size={24} color={colors.background} />
                  )}
                </TouchableOpacity>
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(note.fileUrl)}&embedded=true`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                />
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 size={24} color={colors.background} />
                  ) : (
                    <Maximize2 size={24} color={colors.background} />
                  )}
                </TouchableOpacity>
                <View style={styles.pdfControls}>
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => {
                      setIsSearchVisible(!isSearchVisible);
                      if (!isSearchVisible) {
                        setSearchQuery('');
                        setSearchResults([]);
                        setCurrentSearchIndex(-1);
                        webViewRef.current?.injectJavaScript(`
                          window.clearHighlights();
                          true;
                        `);
                      }
                    }}
                  >
                    <Search size={24} color={isSearchVisible ? colors.primary : '#FFFFFF'} />
                  </TouchableOpacity>
                  {isSearchVisible && <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                      <Search size={20} color={colors.textSecondary} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search in PDF..."
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          if (text) {
                            webViewRef.current?.injectJavaScript(`
                              window.findAndHighlight('${text}');
                              true;
                            `);
                          } else {
                            webViewRef.current?.injectJavaScript(`
                              window.clearHighlights();
                              true;
                            `);
                          }
                        }}
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    {searchResults.length > 0 && (
                      <View style={styles.searchNavigation}>
                        <Text style={styles.searchCount}>
                          {currentSearchIndex + 1} of {searchResults.length}
                        </Text>
                        <TouchableOpacity 
                          style={styles.searchNavButton}
                          onPress={() => {
                            const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
                            setCurrentSearchIndex(newIndex);
                            webViewRef.current?.injectJavaScript(`
                              window.scrollToSearchResult(${searchResults[newIndex]});
                              true;
                            `);
                          }}
                        >
                          <ChevronUp size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.searchNavButton}
                          onPress={() => {
                            const newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
                            setCurrentSearchIndex(newIndex);
                            webViewRef.current?.injectJavaScript(`
                              window.scrollToSearchResult(${searchResults[newIndex]});
                              true;
                            `);
                          }}
                        >
                          <ChevronDown size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>}
                  <TouchableOpacity
                    style={styles.fullscreenButton}
                    onPress={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 size={24} color="#FFFFFF" />
                    ) : (
                      <Maximize2 size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={[styles.pdfContainer, isFullscreen && styles.pdfContainerFullscreen]}>
                  <WebView
                    source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(note.fileUrl)}&embedded=true` }}
                    style={styles.pdf}
                    ref={webViewRef}
                    injectedJavaScript={`
                      // Add search functionality
                      window.findAndHighlight = function(text) {
                        if (!text) return;
                        window.getSelection().removeAllRanges();
                        const results = [];
                        const searchRegex = new RegExp(text, 'gi');
                        const walk = document.createTreeWalker(
                          document.body,
                          NodeFilter.SHOW_TEXT,
                          null,
                          false
                        );
                        let node;
                        while (node = walk.nextNode()) {
                          const matches = node.textContent.match(searchRegex);
                          if (matches) {
                            const range = document.createRange();
                            range.selectNodeContents(node);
                            const rects = range.getClientRects();
                            for (let i = 0; i < rects.length; i++) {
                              results.push(rects[i].top);
                            }
                            const span = document.createElement('span');
                            span.className = 'search-highlight';
                            range.surroundContents(span);
                          }
                        }
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'searchResults',
                          results: results
                        }));
                      };

                      window.clearHighlights = function() {
                        const highlights = document.getElementsByClassName('search-highlight');
                        while (highlights.length > 0) {
                          const parent = highlights[0].parentNode;
                          parent.replaceChild(
                            document.createTextNode(highlights[0].textContent),
                            highlights[0]
                          );
                        }
                      };

                      window.scrollToSearchResult = function(top) {
                        window.scrollTo(0, top);
                      };

                      // Add highlight styles
                      const style = document.createElement('style');
                      style.textContent = '.search-highlight { background-color: yellow; }';
                      document.head.appendChild(style);
                    `}
                    onMessage={(event) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'searchResults') {
                          setSearchResults(data.results);
                          setCurrentSearchIndex(data.results.length > 0 ? 0 : -1);
                        } else if (data.type === 'pageInfo') {
                          setCurrentPage(data.currentPage);
                          setTotalPages(data.totalPages);
                        }
                      } catch (e) {
                        console.error('Error parsing WebView message:', e);
                      }
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View style={styles.pdfLoading}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading PDF...</Text>
                      </View>
                    )}
                  />
                  <View style={styles.pdfControls}>
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={() => {
                        setIsSearchVisible(!isSearchVisible);
                        if (!isSearchVisible) {
                          setSearchQuery('');
                          setSearchResults([]);
                          setCurrentSearchIndex(-1);
                          webViewRef.current?.injectJavaScript(`
                            window.clearHighlights();
                            true;
                          `);
                        }
                      }}
                    >
                      <Search size={24} color={isSearchVisible ? colors.primary : '#FFFFFF'} />
                    </TouchableOpacity>
                    {isSearchVisible && (
                      <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                          <Search size={20} color={colors.textSecondary} />
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Search in PDF..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={colors.textTertiary}
                            returnKeyType="search"
                            onSubmitEditing={() => {
                              if (searchQuery) {
                                webViewRef.current?.injectJavaScript(`
                                  window.findAndHighlight('${searchQuery}');
                                  true;
                                `);
                              }
                            }}
                          />
                          <TouchableOpacity 
                            style={styles.searchActionButton}
                            onPress={() => {
                              if (searchQuery) {
                                webViewRef.current?.injectJavaScript(`
                                  window.findAndHighlight('${searchQuery}');
                                  true;
                                `);
                              } else {
                                webViewRef.current?.injectJavaScript(`
                                  window.clearHighlights();
                                  true;
                                `);
                              }
                            }}
                          >
                            <ArrowRight size={20} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                        {searchResults.length > 0 && (
                          <View style={styles.searchNavigation}>
                            <Text style={styles.searchCount}>
                              {currentSearchIndex + 1} of {searchResults.length}
                            </Text>
                            <TouchableOpacity 
                              style={styles.searchNavButton}
                              onPress={() => {
                                const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
                                setCurrentSearchIndex(newIndex);
                                webViewRef.current?.injectJavaScript(`
                                  window.scrollToSearchResult(${searchResults[newIndex]});
                                  true;
                                `);
                              }}
                            >
                              <ChevronUp size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.searchNavButton}
                              onPress={() => {
                                const newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
                                setCurrentSearchIndex(newIndex);
                                webViewRef.current?.injectJavaScript(`
                                  window.scrollToSearchResult(${searchResults[newIndex]});
                                  true;
                                `);
                              }}
                            >
                              <ChevronDown size={20} color={colors.primary} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.fullscreenButton}
                      onPress={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? (
                        <Minimize2 size={24} color="#FFFFFF" />
                      ) : (
                        <Maximize2 size={24} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pdfFooter}>
                    <View style={styles.pageInfo}>
                      <Text style={styles.pageText}>Page {currentPage} / {totalPages}</Text>
                    </View>
                    <View style={styles.zoomControls}>
                      <TouchableOpacity 
                        style={styles.zoomButton}
                        onPress={() => {
                          const newScale = Math.max(0.5, scale - 0.25);
                          setScale(newScale);
                          webViewRef.current?.injectJavaScript(`
                            document.body.style.zoom = ${newScale};
                            true;
                          `);
                        }}
                      >
                        <Minus size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.zoomButton}
                        onPress={() => {
                          const newScale = Math.min(3, scale + 0.25);
                          setScale(newScale);
                          webViewRef.current?.injectJavaScript(`
                            document.body.style.zoom = ${newScale};
                            true;
                          `);
                        }}
                      >
                        <Plus size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
        
        {!isFullscreen && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statButton}>
                <Text style={[styles.statText, dimensions.width < 350 ? { fontSize: 12 } : {}]}>
                  {dimensions.width < 350 ? `${note?.downloads} DL` : `${note?.downloads} downloads`}
                </Text>
              </View>
            </View>
            
            <View style={styles.uploaderContainer}>
              <Image 
                source={{ uri: note?.uploaderAvatar || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36' }} 
                style={{
                  width: dimensions.width < 350 ? 40 : 48,
                  height: dimensions.width < 350 ? 40 : 48,
                  borderRadius: dimensions.width < 350 ? 20 : 24,
                  marginRight: dimensions.width < 350 ? 8 : 16
                }}
              />
              <View style={styles.uploaderInfo}>
                <Text style={[styles.uploaderName, dimensions.width < 350 ? { fontSize: 14 } : {}]}>
                  {dimensions.width < 300 && note.uploaderName.length > 8 
                    ? `${note.uploaderName.substring(0, 8)}...` 
                    : dimensions.width < 350 && note.uploaderName.length > 10
                      ? `${note.uploaderName.substring(0, 10)}...`
                      : note.uploaderName}
                </Text>
                
                {session?.user?.id && note.uploaderId !== session.user.id && (
                  <View style={styles.followButtonWrapper}>
                    <Button
                      title={isFollowing ? 'Following' : 'Follow'}
                      onPress={async () => {
                        if (!note.uploaderId) return;
                        if (isFollowing) {
                          await unfollowUser(note.uploaderId);
                        } else {
                          await followUser(note.uploaderId);
                        }
                      }}
                      variant={isFollowing ? 'outline' : 'primary'}
                      size={dimensions.width < 350 ? "mini" : "small"}
                    />
                  </View>
                )}
                
                <Text style={[styles.uploadDate, dimensions.width < 350 ? { fontSize: 12 } : {}]}>
                  {note?.createdAt && 
                    (dimensions.width < 350 
                      ? new Date(note.createdAt).toLocaleDateString('en-US', {
                          year: '2-digit',
                          month: 'short',
                          day: 'numeric'
                        })
                      : new Date(note.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                    )
                  }
                </Text>
              </View>
            </View>
          </>
        )}
        
        <ReviewsSection />
        
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.downloadButtonContainer}>
            <NoteDownloadButton
              noteId={note?.id}
              noteName={note?.title}
              fileUrl={note?.fileUrl}
              creatorId={note?.uploaderId}
            />
            <TouchableOpacity 
              style={styles.previewButton}
              onPress={handlePreviewPress}
            >
              <FileText size={20} color={colors.primary} />
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>
          </View>
          {isOwner && (
            <TouchableOpacity 
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* PDF Preview Modal - Only for native platforms */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showPdfPreview}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPdfPreview(false)}
        >
          <View style={styles.fullscreenContainer}>
            <View style={styles.pdfHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPdfPreview(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.pdfTitle} numberOfLines={1}>
                {note?.title}
              </Text>
              <View style={styles.pageControls}>
                <TouchableOpacity 
                  style={[styles.pageButton, currentPdfPage <= 1 && styles.disabledButton]}
                  onPress={() => {
                    if (currentPdfPage > 1) {
                      setCurrentPdfPage(prev => prev - 1);
                      pdfViewerRef.current?.injectJavaScript(`window.scrollTo(0, 0); true;`);
                    }
                  }}
                  disabled={currentPdfPage <= 1}
                >
                  <Text style={styles.pageButtonText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.pageIndicator}>
                  Page {currentPdfPage} of {totalPdfPages}
                </Text>
                <TouchableOpacity 
                  style={[styles.pageButton, currentPdfPage >= totalPdfPages && styles.disabledButton]}
                  onPress={() => {
                    if (currentPdfPage < totalPdfPages) {
                      setCurrentPdfPage(prev => prev + 1);
                      pdfViewerRef.current?.injectJavaScript(`window.scrollTo(0, 0); true;`);
                    }
                  }}
                  disabled={currentPdfPage >= totalPdfPages}
                >
                  <Text style={styles.pageButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.webviewContainer}>
              <WebView
                ref={pdfViewerRef}
                source={{ uri: note?.fileUrl || '' }}
                style={styles.fullscreenWebView}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}
                onMessage={(event: WebViewMessageEvent) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'TOTAL_PAGES') {
                      setTotalPdfPages(parseInt(data.pages, 10) || 1);
                    }
                  } catch (error) {
                    console.error('Error parsing PDF page data:', error);
                  }
                }}
                injectedJavaScript={`
                  // Get total pages from PDF
                  const getTotalPages = () => {
                    const pageCount = document.querySelectorAll('.page').length;
                    if (pageCount > 0) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'TOTAL_PAGES',
                        pages: pageCount
                      }));
                    }
                    return true;
                  };
                  
                  // Run on page load
                  setTimeout(getTotalPages, 1000);
                  
                  // Also check periodically as the PDF loads
                  setInterval(getTotalPages, 2000);
                  
                  true;
                `}
              />
            </View>
          </View>
        </Modal>
      )}
      
      <Modal
        visible={showImagePreview}
        transparent={true}
        onRequestClose={() => {
          console.log('Image preview modal closed');
          setShowImagePreview(false);
        }}
        onShow={() => console.log('Image preview modal opened')}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              console.log('Close button pressed in image preview');
              setShowImagePreview(false);
            }}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          {previewImageUrl ? (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.imagePreview}
              resizeMode="contain"
              onLoadStart={() => console.log('Image loading started')}
              onLoadEnd={() => console.log('Image loading finished')}
              onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
            />
          ) : (
            <Text style={styles.loadingText}>Loading preview...</Text>
          )}
        </View>
      </Modal>

      <AdModal 
        visible={showAdModal} 
        onClose={() => setShowAdModal(false)}
        onAdComplete={handleAdComplete}
        noteId={note?.id}
        noteName={note?.title}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  modalButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    marginVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pdfTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  pageIndicator: {
    color: colors.text,
    marginHorizontal: 8,
    minWidth: 100,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullscreenWebView: {
    flex: 1,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  userActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    marginRight: 8,
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  // Moved to avoid duplicate with review modal styles
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  uploaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  followingButton: {
    backgroundColor: colors.border,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.text,
  },
  bannerAd: {
    width: '100%',
    marginBottom: 16,
  },
  pdfContainer: {
    height: Dimensions.get('window').height * 0.7,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    position: 'relative',
  },
  pdfContainerFullscreen: {
    height: Dimensions.get('window').height,
    marginVertical: 0,
    borderRadius: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: colors.background,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.card,
  },
  pdfLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 120, 
    width: '100%',
    height: '100%',
  },
  header: {
    padding: 16,
    backgroundColor: colors.card,
    width: '100%',
  },
  headerButton: {
    padding: 8,
  },
  thumbnail: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fileType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 20,
  },
  statButton: {
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  uploaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 16,
  },
  followButtonWrapper: {
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  uploaderInfo: {
    flex: 1,
    flexDirection: 'column',
  },

  uploadDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    minWidth: 200,
  },
  footer: {
    padding: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    minHeight: Platform.OS === 'ios' ? 90 : 70,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    height: '100%',
  },
  downloadButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
    maxWidth: '100%',
    paddingHorizontal: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  previewButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  pdfFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 12,
  },
  pageInfo: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pageText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pdfControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    marginRight: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    marginRight: 8,
    color: colors.text,
    fontSize: 16,
  },
  searchActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  searchNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  searchCount: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchNavButton: {
    padding: 8,
    marginLeft: 8,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '80%',
  },
  // Moved to avoid duplicate with review modal styles
  // Moved to avoid duplicate with review modal styles
  ratingLabel: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  reviewsContainer: {
    padding: 16,
    backgroundColor: '#000000',
    marginTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  ratingOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  ratingLeft: {
    alignItems: 'flex-start',
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    marginRight: 8,
  },
  reviewCount: {
    color: '#999999',
    fontSize: 14,
  },
  writeReviewButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  writeReviewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  filterButtonActive: {
    backgroundColor: '#8A2BE2',
    borderColor: '#8A2BE2',
  },
  filterButtonText: {
    color: 'white',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  // Review Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#999',
    lineHeight: 24,
  },
  ratingLabel: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
  },
  submitButton: {
    backgroundColor: '#8A2BE2',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Reviews List
  noReviews: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#000000',
  },
  reviewsList: {
    maxHeight: 300,
  },
  reviewItem: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewAuthor: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  reviewDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  reviewComment: {
    color: 'white',
    marginTop: 8,
    lineHeight: 20,
  },
  noReviewsText: {
    color: '#999999',
    marginBottom: 16,
    fontSize: 16,
  },
  firstReviewButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  firstReviewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

});