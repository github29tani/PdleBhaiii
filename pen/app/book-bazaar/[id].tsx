import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Linking, 
  Share, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  MessageSquare, 
  Phone, 
  Share2, 
  Heart, 
  MapPin, 
  User, 
  BookOpen, 
  Award, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Pencil,
  Trash2
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { 
  fetchBookListingById,
  deleteBookListing as deleteBookListingAPI
} from '@/lib/supabase/book-bazaar';
import { createMessageThread } from '@/lib/supabase/messages';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/lib/supabase/supabase';

const { width } = Dimensions.get('window');

interface BookImage {
  url: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  subject: string;
  class_level?: string;
  board?: string;
  condition: string;
  created_at: string;
  updated_at: string;
}

interface Seller {
  id: string;
  avatar_url: string | null;
  name: string | null;
}

interface BookListing {
  id: string;
  price_inr: number;
  is_free: boolean;
  is_for_exchange: boolean;
  exchange_details?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  contact_preference: 'whatsapp' | 'phone' | 'in_app';
  contact_phone?: string;
  contact_whatsapp?: string;
  is_sold?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  book: Book;
  images: BookImage[];
  seller: Seller;
}

export default function BookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [book, setBook] = useState<BookListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[BookDetails] Component mounted');
    const loadBook = async () => {
      console.log(`[BookDetails] Loading book with ID: ${id}`);
      if (!id) {
        console.error('[BookDetails] Error: No book ID provided');
        setError('Book ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`[BookDetails] Fetching book details for ID: ${id}`);
        const data = await fetchBookListingById(id);
        
        if (data) {
          console.log(`[BookDetails] Successfully loaded book: ${data.book.title}`);
          console.log(`[BookDetails] Seller ID: ${data.seller.id}, Contact Preference: ${data.contact_preference}`);
          console.log('[BookDetails] Full data structure received:', {
            book: {
              title: data.book.title,
              author: data.book.author,
              condition: data.book.condition
            },
            seller: {
              id: data.seller.id,
              avatar_url: data.seller.avatar_url,
              name: data.seller.name
            },
            contact_preference: data.contact_preference,
            price: data.price_inr,
            is_free: data.is_free,
            is_for_exchange: data.is_for_exchange
          });
          setBook(data);
        } else {
          console.error(`[BookDetails] Book not found with ID: ${id}`);
          setError('Book not found');
        }
      } catch (err) {
        console.error('[BookDetails] Error fetching book:', err);
        setError('Failed to load book details. Please try again.');
      } finally {
        console.log('[BookDetails] Finished loading book details');
        setLoading(false);
      }
    };

    loadBook();
    
    return () => {
      console.log('[BookDetails] Component unmounting');
    };
  }, [id]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !book?.id) {
          setIsFavorite(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('listing_id', book.id)
          .maybeSingle();

        if (error) {
          console.error('[BookDetails] Error checking favorite status:', error);
          return;
        }

        setIsFavorite(!!data);
      } catch (error) {
        console.error('[BookDetails] Error in checkFavoriteStatus:', error);
      }
    };

    checkFavoriteStatus();
  }, [book?.id]);

  const handleContactSeller = async () => {
    console.log('[BookDetails] Contact seller button clicked', { 
      bookId: book?.id,
      sellerId: book?.seller?.id,
      timestamp: new Date().toISOString()
    });
    
    if (!book) {
      console.error('[BookDetails] Cannot contact seller: book data not loaded');
      Alert.alert('Error', 'Book information not available');
      return;
    }
    
    if (!book.seller?.id) {
      console.error('[BookDetails] Cannot contact seller: seller information is missing', { book });
      Alert.alert('Error', 'Seller information is not available');
      return;
    }
    
    const contactNumber = book.contact_whatsapp || book.contact_phone;
    console.log('[BookDetails] Contact information:', { 
      preference: book.contact_preference, 
      contactNumber: contactNumber || 'Not provided',
      hasWhatsApp: !!book.contact_whatsapp,
      hasPhone: !!book.contact_phone
    });
    
    // Always allow in-app chat as a fallback
    const tryInAppChat = async () => {
      try {
        console.log('[BookDetails] Starting in-app chat flow', {
          bookId: book.id,
          sellerId: book.seller.id,
          timestamp: new Date().toISOString()
        });
        
        console.log('[BookDetails] Calling createMessageThread...');
        const threadId = await createMessageThread(book.id, book.seller.id);
        
        console.log('[BookDetails] Successfully created/retrieved message thread', {
          threadId,
          timestamp: new Date().toISOString()
        });
        
        console.log('[BookDetails] Navigating to chat screen...');
        router.push(`/book-bazaar/messages/chat/${threadId}`);
        
      } catch (error) {
        console.error('[BookDetails] Error in in-app chat flow:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        Alert.alert('Error', 'Failed to start chat. Please try again.');
      }
    };

    // Handle contact based on preference
    if (book.contact_preference === 'in_app') {
      await tryInAppChat();
    } 
    else if (book.contact_preference === 'whatsapp') {
      if (contactNumber) {
        const url = `whatsapp://send?phone=${contactNumber}&text=Hi, I'm interested in your book "${book.book.title}"`;
        console.log(`[BookDetails] Opening WhatsApp with URL: ${url}`);
        
        // Check if WhatsApp is installed
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          Linking.openURL(url).catch((err) => {
            console.error('[BookDetails] Failed to open WhatsApp:', err);
            // Fall back to in-app chat if WhatsApp fails
            tryInAppChat();
          });
        } else {
          console.log('[BookDetails] WhatsApp not installed, falling back to in-app chat');
          await tryInAppChat();
        }
      } else {
        console.warn('[BookDetails] No WhatsApp number available, falling back to in-app chat');
        await tryInAppChat();
      }
    } 
    else if (book.contact_preference === 'phone') {
      if (contactNumber) {
        console.log(`[BookDetails] Making phone call to: ${contactNumber}`);
        Linking.openURL(`tel:${contactNumber}`).catch(async (err) => {
          console.error('[BookDetails] Failed to initiate phone call:', err);
          // Fall back to in-app chat if phone call fails
          await tryInAppChat();
        });
      } else {
        console.warn('[BookDetails] No phone number available, falling back to in-app chat');
        await tryInAppChat();
      }
    }
  };

  const handleShare = async () => {
    console.log('[BookDetails] Share button clicked');
    if (!book) {
      console.error('[BookDetails] Cannot share: book data not loaded');
      return;
    }
    
    const shareMessage = `Check out "${book.book.title}" by ${book.book.author} for ₹${book.price} on StudySphere`;
    const shareUrl = `https://studysphere.app/book-bazaar/${book.id}`;
    
    console.log(`[BookDetails] Sharing book: ${book.book.title}, URL: ${shareUrl}`);
    
    try {
      console.log('[BookDetails] Opening share dialog');
      const result = await Share.share({
        message: shareMessage,
        url: shareUrl,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`[BookDetails] Shared with activity type: ${result.activityType}`);
        } else {
          console.log('[BookDetails] Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('[BookDetails] Share dialog dismissed');
      }
    } catch (error) {
      console.error('[BookDetails] Error sharing:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const newFavoriteState = !isFavorite;
      console.log(`[BookDetails] Toggling favorite status to: ${newFavoriteState}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[BookDetails] User not authenticated, cannot save favorite');
        Alert.alert('Login Required', 'Please login to save favorites');
        router.push('/(auth)/login');
        return;
      }

      if (!book?.id) {
        console.error('[BookDetails] No book ID available');
        return;
      }

      if (newFavoriteState) {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .upsert({
            user_id: user.id,
            listing_id: book.id,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,listing_id'
          });

        if (error) {
          if (error.code === '42P01') { // Undefined table
            console.error('[BookDetails] user_favorites table does not exist');
            Alert.alert('Error', 'Favorites feature is not available');
            return;
          }
          throw error;
        }
      } else {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('book_listing_id', book.id);

        if (error) {
          if (error.code === '42P01') { // Undefined table
            console.error('[BookDetails] user_favorites table does not exist');
            return;
          }
          throw error;
        }
      }

      setIsFavorite(newFavoriteState);
      console.log(`[BookDetails] Favorite status updated to: ${newFavoriteState}`);
    } catch (error) {
      console.error('[BookDetails] Error updating favorite status:', error);
      Alert.alert('Error', 'Failed to update favorite status. Please try again.');
      // Revert the UI state on error
      setIsFavorite(!newFavoriteState);
    }
  };

  const renderImagePagination = () => {
    if (!book?.images || book.images.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {book.images.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.paginationDot, 
              index === currentImageIndex && styles.paginationDotActive
            ]} 
          />
        ))}
      </View>
    );
  };

  const getConditionText = (condition: string) => {
    const conditions: Record<string, string> = {
      'new': 'New',
      'like_new': 'Like New',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };
    return conditions[condition] || condition;
  };

  const renderImageGallery = () => {
    if (!book?.images?.length) {
      return (
        <View style={[styles.imageContainer, styles.imagePlaceholder]}>
          <BookOpen size={48} color={colors.textSecondary} />
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: book.images[currentImageIndex].url }} 
          style={styles.mainImage} 
          resizeMode="contain"
        />
        {renderImagePagination()}
        
        {book.images.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
            contentContainerStyle={styles.thumbnailContent}
          >
            {book.images.map((image, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.thumbnailWrapper,
                  index === currentImageIndex && styles.thumbnailActive
                ]}
              >
                <Image 
                  source={{ uri: image.url }} 
                  style={styles.thumbnail} 
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    console.log('[BookDetails] Delete button pressed');
    if (!book || isDeleting) return;
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    console.log('[BookDetails] Delete confirmed by user');
    setShowDeleteDialog(false);
    
    if (!book) {
      console.error('[BookDetails] Cannot delete: No book data available');
      return;
    }
    
    if (isDeleting) {
      console.log('[BookDetails] Delete already in progress');
      return;
    }

    console.log(`[BookDetails] Starting deletion for book: ${book.id}`);
    console.log(`[BookDetails] Current user ID: ${user?.id}, Book owner ID: ${book.seller.id}`);
    
    try {
      console.log('[BookDetails] Setting isDeleting to true');
      setIsDeleting(true);
      
      console.log(`[BookDetails] Calling deleteBookListingAPI for book ID: ${book.id}`);
      await deleteBookListingAPI(book.id);
      
      console.log('[BookDetails] Book listing deleted successfully from API');
      
      // Navigate back to browse screen immediately
      console.log('[BookDetails] Navigating back to book listings');
      router.replace('/book-bazaar');
      
      // Show success message after navigation
      Alert.alert(
        "Success", 
        "Book listing has been deleted successfully."
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[BookDetails] Error in delete process: ${errorMessage}`, error);
      
      Alert.alert(
        "Error", 
        `Failed to delete book listing. ${errorMessage}`
      );
    } finally {
      console.log('[BookDetails] Setting isDeleting to false');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={styles.errorText}>{error || 'Book not found'}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{book.book.title}</Text>
          <Text style={styles.headerSubtitle}>{book.book.author}</Text>
        </View>
        <View style={styles.headerActions}>
          {book.seller.id === user?.id && (
            <>
              <TouchableOpacity 
                onPress={() => router.push(`/book-bazaar/post-ad/edit/${book.id}`)}
                style={styles.editButton}
              >
                <Pencil size={20} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDeleteClick}
                style={[styles.editButton, styles.deleteButton]}
                disabled={isDeleting}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={20} color="#fff" />
                    <Text style={[styles.editButtonText, { color: '#fff' }]}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity 
            onPress={toggleFavorite} 
            style={[styles.headerButton, { marginRight: 8 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart 
              size={24} 
              color={isFavorite ? colors.error : colors.text} 
              fill={isFavorite ? colors.error : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleShare}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Badges */}
      <View style={styles.badgesContainer}>
        {book.is_free && (
          <View style={[styles.badge, styles.freeBadge]}>
            <Text style={styles.badgeText}>Free</Text>
          </View>
        )}
        {book.is_for_exchange && (
          <View style={[styles.badge, styles.exchangeBadge]}>
            <Text style={styles.badgeText}>
              {book.exchange_details ? `Exchange: ${book.exchange_details}` : 'For Exchange'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Book Info */}
        <View style={styles.section}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{(book.price || 0).toLocaleString()}</Text>
            <View style={[styles.badge, styles.conditionBadge]}>
              <Text style={styles.conditionText}>
                {getConditionText(book.condition)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.title} numberOfLines={2}>
            {book.book.title}
          </Text>
          <Text style={styles.author}>
            by {book.book.author}
          </Text>
          
          <View style={styles.metaContainer}>
            {book.book.subject && (
              <View style={styles.metaItem}>
                <BookOpen size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{book.book.subject}</Text>
              </View>
            )}
            {book.book.class_level && (
              <View style={styles.metaItem}>
                <Award size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{book.book.class_level}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {formatDistanceToNow(new Date(book.created_at), { addSuffix: true })}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {book.book.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text 
              style={styles.description}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {book.book.description}
            </Text>
            {book.book.description.length > 100 && (
              <TouchableOpacity 
                onPress={() => setShowFullDescription(!showFullDescription)}
                style={styles.readMoreButton}
              >
                <Text style={styles.readMoreText}>
                  {showFullDescription ? 'Read Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Seller Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <TouchableOpacity 
            style={styles.sellerCard}
            onPress={() => router.push(`/profile/${book.seller.id}`)}
          >
            <View style={styles.sellerHeader}>
              <View style={styles.sellerAvatar}>
                {book.seller.avatar_url ? (
                  <Image 
                    source={{ uri: book.seller.avatar_url }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <User size={24} color={colors.primary} />
                )}
              </View>
              <TouchableOpacity 
                style={styles.sellerInfo}
                onPress={() => {
                  if (book?.seller?.id) {
                    router.push(`/user/${book.seller.id}`);
                  }
                }}
              >
                <Text style={styles.sellerName} numberOfLines={1}>
                  {book.seller.name || 'Seller'}
                </Text>
                <Text style={styles.sellerMemberSince}>
                  Member since {new Date(book.seller.created_at || book.created_at).getFullYear()}
                </Text>
              </TouchableOpacity>
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={2}>
              {book.location || 'Location not specified'}
            </Text>
          </View>
          <View style={styles.safetyNote}>
            <AlertCircle size={16} color={colors.warning} />
            <Text style={styles.safetyNoteText}>
              Meet in a public place for safety
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleContactSeller}
        >
          {book.contact_preference === 'phone' ? (
            <Phone size={20} color="#fff" style={styles.buttonIcon} />
          ) : (
            <MessageSquare size={20} color="#fff" style={styles.buttonIcon} />
          )}
          <Text style={styles.primaryButtonText}>
            {book.contact_preference === 'phone' ? 'Call Seller' : 'Message Seller'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Trash2 size={24} color={colors.error || '#FF3B30'} />
              <Text style={styles.modalTitle}>Delete Book Listing</Text>
            </View>
            
            <Text style={styles.modalText}>
              Are you sure you want to delete "{book?.book.title}"? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  console.log('[BookDetails] User cancelled deletion');
                  setShowDeleteDialog(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  isDeleting && styles.disabledButton
                ]}
                onPress={handleDeleteConfirm}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={styles.deleteButtonContent}>
                    <Trash2 size={18} color="#fff" style={styles.deleteIcon} />
                    <Text style={styles.confirmButtonText}>Delete</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    backgroundColor: '#000000',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  freeBadge: {
    backgroundColor: colors.success,
  },
  exchangeBadge: {
    backgroundColor: colors.warning,
  },
  conditionBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
  },
  conditionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    padding: 24,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5856D6',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#007AFF',
  },
  thumbnailContainer: {
    width: '100%',
    marginTop: 8,
    backgroundColor: '#1a1a2e',
  },
  thumbnailContent: {
    padding: 8,
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
  },
  thumbnailActive: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: '#b8b8ff',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#a0a0ff',
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  readMoreButton: {
    marginTop: 8,
  },
  readMoreText: {
    color: '#007AFF',
    fontSize: 14,
  },
  sellerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  sellerMemberSince: {
    fontSize: 12,
    color: '#a0a0ff',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFA500',
    borderRadius: 8,
  },
  safetyNoteText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 12,
  },
  footer: {
    backgroundColor: '#000000',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    marginLeft: 8,
    backgroundColor: colors.error || '#FF3B30',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#E0E0E0',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cancelButton: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  confirmButton: {
    backgroundColor: colors.error || '#FF3B30',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    marginRight: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primary || '#007AFF',
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
