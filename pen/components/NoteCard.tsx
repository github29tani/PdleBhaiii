import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Bookmark, BookmarkCheck, UserPlus, UserCheck, Award, MessageSquare } from 'lucide-react-native';
import { Note } from '@/types';
import { colors } from '@/constants/colors';
import { useNotesStore } from '@/store/notes-store';
import { useFollowingStore } from '@/store/following-store';
import { useAuthStore } from '@/store/auth-store';
import { NoteDownloadButton } from './NoteDownloadButton';
import { supabase } from '@/lib/supabase';
import { NotesState } from '@/store/notes-store';

interface NoteCardProps {
  note: Note;
  compact?: boolean;
  showVerificationTooltip?: boolean;
  onPress?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, compact = false, showVerificationTooltip = false, onPress }) => {
  console.log('[NoteCard] Component rendered', {
    noteId: note.id,
    title: note.title,
    compact,
    showVerificationTooltip
  });

  const router = useRouter();
  const { toggleBookmark, toggleLike, fetchNotes, isLoading, updateNote } = useNotesStore();
  const { user } = useAuthStore();

  useEffect(() => {
    console.log('[NoteCard] Note state update', {
      id: note.id,
      isLiked: note.isLiked,
      isBookmarked: note.isBookmarked,
      isLoading
    });
  }, [note, isLoading]);

  const fetchSpecificNote = async (noteId: string) => {
    console.log('[NoteCard] Fetching specific note:', noteId);
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select(`
          *,
          profiles:uploader_id (
            name,
            avatar_url,
            is_verified,
            verification_reason
          )
        `)
        .eq('id', noteId)
        .single();

      if (error) {
        console.error('[NoteCard] Error fetching specific note:', error);
        throw error;
      }

      if (!notes) {
        console.error('[NoteCard] Note not found:', noteId);
        throw new Error('Note not found');
      }

      console.log('[NoteCard] Successfully fetched note:', {
        id: notes.id,
        title: notes.title,
        uploader: notes.profiles
      });

      // Update the note in the store
      updateNote(notes);
    } catch (error) {
      console.error('[NoteCard] Failed to fetch specific note:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  // Fetch specific note when component mounts
  useEffect(() => {
    if (!note.id) return;
    console.log('[NoteCard] Fetching specific note:', note.id);
    fetchSpecificNote(note.id);
  }, [note.id]);
  
  // Only validate required fields
  if (!note || isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { 
    isFollowing, 
    toggleFollow, 
    followingUsers,
    fetchFollowingIds
  } = useFollowingStore();

  const [isFollowingState, setIsFollowingState] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Update follow state when user or following data changes
  useEffect(() => {
    console.log('[NoteCard] Follow state update check:', {
      hasUser: !!user,
      userId: user?.id,
      hasUploaderId: !!note?.uploaderId,
      uploaderId: note?.uploaderId,
      followingUsersCount: followingUsers.length,
      followingIds: followingUsers.map(u => u.id)
    });

    if (user?.id && note?.uploaderId) {
      const following = followingUsers.some(user => user.id === note.uploaderId);
      console.log('[NoteCard] Following status:', { 
        userId: user.id, 
        uploaderId: note.uploaderId, 
        isFollowing: following 
      });
      setIsFollowingState(following);
    } else {
      console.log('[NoteCard] Missing required data for follow status:', {
        hasUser: !!user,
        hasUserId: !!user?.id,
        hasUploaderId: !!note?.uploaderId
      });
    }
  }, [user, note?.uploaderId, followingUsers]);

  // Debug log for follow button rendering
  useEffect(() => {
    console.log('[NoteCard] Follow button check:', {
      hasUser: !!user,
      userId: user?.id,
      hasUploaderId: !!note?.uploaderId,
      uploaderId: note?.uploaderId,
      isDifferentUser: user?.id !== note?.uploaderId,
      shouldShowButton: user?.id && user.id !== note.uploaderId,
      noteId: note?.id,
      noteTitle: note?.title
    });
  }, [user, note?.uploaderId, note?.id, note?.title]);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      console.log('[NoteCard] Initializing data...', { 
        hasUser: !!user,
        userId: user?.id 
      });
      
      if (user?.id) {
        try {
          console.log('[NoteCard] Fetching following IDs...');
          await fetchFollowingIds();
          console.log('[NoteCard] Fetching notes...');
          await fetchNotes();
          console.log('[NoteCard] Data initialization complete');
        } catch (error) {
          console.error('[NoteCard] Error initializing data:', error);
        }
      } else {
        console.log('[NoteCard] User not logged in, skipping data initialization');
      }
    };
    
    init();
  }, [user?.id]);
  
  const handlePress = () => {
    router.push(`/note/${note.id}`);
  };
  
  const handleBookmark = (e: any) => {
    e.stopPropagation();
    toggleBookmark(note.id);
  };
  
  const handleLike = async (e: any) => {
    e.stopPropagation();
    console.log('[NoteCard] Like clicked:', {
      noteId: note.id,
      currentLikeStatus: note.isLiked,
      currentLikes: note.likes,
      userId: user?.id
    });

    if (!user) {
      console.log('[NoteCard] Cannot like - user not logged in');
      return;
    }

    try {
      await toggleLike(note.id);
      console.log('[NoteCard] toggleLike completed');
      
      // Refresh notes to get updated like status
      await fetchNotes();
      console.log('[NoteCard] Notes refreshed, new like status:', {
        noteId: note.id,
        newLikeStatus: note.isLiked,
        newLikes: note.likes
      });
    } catch (error) {
      console.error('[NoteCard] Error in handleLike:', error);
    }
  };


  const handleComments = (e: any) => {
    e.stopPropagation();
    router.push(`/note/${note.id}/comments`);
  };
  
  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer} 
        onPress={onPress || handlePress}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: note.thumbnailUrl }} 
          style={styles.compactThumbnail} 
        />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>{note.title}</Text>
          <Text style={styles.compactSubject}>{note.subject}</Text>
          <View style={styles.compactStats}>
            <View style={styles.compactIconButton}>
              <Heart size={14} color={note.isLiked ? colors.error : colors.textTertiary} />
              <Text style={styles.statText}>{note.likes}</Text>
            </View>
            <View style={styles.compactIconButton}>
              <Text style={styles.statText}>{note.downloads} downloads</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  

  const handleFollow = async (e: any) => {
    e.stopPropagation();
    console.log('[NoteCard] handleFollow called:', {
      hasUser: !!user,
      userId: user?.id,
      hasUploaderId: !!note?.uploaderId,
      uploaderId: note?.uploaderId,
      isProcessing
    });
    
    if (!user?.id || !note?.uploaderId || isProcessing) {
      console.log('[NoteCard] Cannot follow - missing data or operation in progress:', {
        hasUser: !!user,
        userId: user?.id,
        hasUploaderId: !!note?.uploaderId,
        uploaderId: note?.uploaderId,
        isProcessing
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Optimistically update the UI
      const newFollowingState = !isFollowingState;
      setIsFollowingState(newFollowingState);
      
      // Toggle follow in the backend
      await toggleFollow(note.uploaderId);
      
      // Refresh the following list to ensure consistency
      await fetchFollowingIds();
    } catch (error) {
      // Revert on error
      setIsFollowingState(!isFollowingState);
      console.error('Error toggling follow:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress || handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.headerSection}>
        <View style={styles.uploaderInfo}>
          <Image 
            source={{ 
              uri: note.uploaderAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(note.uploaderName) + '&background=random'
            }} 
            style={styles.uploaderAvatar}
            resizeMode="cover"
          />
          <Text style={styles.uploaderNameText}>{note.uploaderName}</Text>
          {note.uploaderIsVerified && (
            <Award 
              size={14} 
              color={colors.primary} 
              style={styles.verificationBadge}
            />
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          {user?.id && user.id !== note.uploaderId && (
            <TouchableOpacity 
              style={[
                styles.followButton, 
                isFollowingState ? styles.followingButton : {},
                isProcessing && { opacity: 0.7 }
              ]}
              onPress={handleFollow}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={isFollowingState ? colors.primary : '#FFFFFF'} />
              ) : isFollowingState ? (
                <>
                  <UserCheck size={14} color={colors.primary} />
                  <Text style={[styles.followButtonText, styles.followingButtonText]}>Following</Text>
                </>
              ) : (
                <>
                  <UserPlus size={14} color="#FFFFFF" />
                  <Text style={styles.followButtonText}>Follow</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Image 
        source={{ uri: note.thumbnailUrl }} 
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{note.title}</Text>
          <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkButton}>
            {note.isBookmarked ? (
              <BookmarkCheck size={20} color={colors.primary} />
            ) : (
              <Bookmark size={20} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>{note.description}</Text>
        
        <View style={styles.metaContainer}>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{note.subject}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.badgeText, { color: colors.secondary }]}>{note.class}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.stats}>
            <TouchableOpacity 
              style={[
                styles.iconButton, 
                note.isLiked && styles.likedButton
              ]} 
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Heart 
                size={20} 
                fill={note.isLiked ? colors.error : 'none'}
                color={note.isLiked ? colors.error : colors.primary} 
              />
              <Text style={[
                styles.statText, 
                note.isLiked && styles.likedText
              ]}>
                {note.likes || 0}
              </Text>
            </TouchableOpacity>
            
<TouchableOpacity 
              style={styles.iconButton}
              onPress={handleComments}
              activeOpacity={0.7}
            >
              <MessageSquare 
                size={20} 
                color={colors.primary}
              />
              <Text style={styles.statText}>{note.comments || 0}</Text>
            </TouchableOpacity>
            
            <View style={styles.downloadButton}>
              <NoteDownloadButton
                noteId={note.id}
                noteName={note.title}
                fileUrl={note.fileUrl || (note as any).file_url}
                creatorId={note.uploaderId || (note as any).uploader_id}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 160
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from flex-start to center for vertical alignment
  },
  uploaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  uploaderNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 10, // Added margin for better spacing
  },
  verificationBadge: {
    marginLeft: 4,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  followingButton: {
    backgroundColor: '#6B4EE6', // Updated to match coffee icon purple
    borderWidth: 0,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  likedButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  likedText: {
    color: colors.error,
    fontWeight: '600',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textTertiary,
  },
  downloadButton: {
    marginLeft: 16,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  compactThumbnail: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  compactContent: {
    flex: 1,
    padding: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  compactSubject: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 16,
    marginHorizontal: 0, // Removed horizontal margin
    lineHeight: 16,
    color: colors.textTertiary,
  },
  starButton: {
    padding: 2, // Reduced padding
  },
});