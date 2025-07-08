import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types';
import { supabase } from '@/lib/supabase';

export interface NotesState {
  notes: Note[];
  trendingNotes: Note[];
  recommendedNotes: Note[];
  bookmarkedNotes: Note[];
  downloadedNotes: Note[];
  uploadedNotes: Note[];
  likedNotes: Note[];
  dislikedNotes: Note[];
  isLoading: boolean;
  isTrendingLoading: boolean;
  isRecommendedLoading: boolean;
  isBookmarksLoading: boolean;
  isDownloadsLoading: boolean;
  isUploadsLoading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  fetchTrendingNotes: () => Promise<void>;
  fetchRecommendedNotes: (interests: string[]) => Promise<void>;
  fetchBookmarkedNotes: () => Promise<void>;
  fetchLikedNotes: () => Promise<void>;
  fetchDownloadedNotes: () => Promise<void>;
  fetchUploadedNotes: (userId: string) => Promise<void>;
  downloadNote: (noteId: string) => Promise<void>;
  toggleBookmark: (noteId: string) => void;
  toggleLike: (noteId: string) => void;
  toggleDislike: (noteId: string) => void;
  uploadNote: (note: {
    title: string;
    description: string;
    subject: string;
    class: string;
    board: string | null;
    topic: string;
    file_type: string;
    file_url: string;
    thumbnail_url: string | null;
    uploader_id: string;
    likes: number;
    downloads: number;
    comments: number;
  }) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  recordView: (noteId: string) => Promise<void>;
  recordAdClick: (noteId: string) => Promise<void>;
  recordSupportTip: (noteId: string, amount: number) => Promise<void>;
  updateNote: (note: Note) => void;
  updateCommentCount: (noteId: string) => Promise<void>;
  rateNote: (noteId: string, rating: number) => Promise<void>;
  fetchUserRating: (noteId: string) => Promise<number | null>;
  refreshNotes: () => Promise<void>;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      recordView: async (noteId) => {
        try {
          const { error } = await supabase.rpc('record_view', {
            p_note_id: noteId
          });
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            notes: state.notes.map(note =>
              note.id === noteId
                ? { ...note, views: note.views + 1 }
                : note
            )
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to record view" });
        }
      },

      recordAdClick: async (noteId) => {
        try {
          const { error } = await supabase.rpc('record_ad_click', {
            p_note_id: noteId
          });
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            notes: state.notes.map(note =>
              note.id === noteId
                ? {
                    ...note,
                    adClicks: (note.adClicks || 0) + 1,
                    earnings: (note.earnings || 0) + 0.10
                  }
                : note
            )
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to record ad click" });
        }
      },

      recordSupportTip: async (noteId, amount) => {
        try {
          const { error } = await supabase.rpc('record_support_tip', {
            p_note_id: noteId,
            p_amount: amount
          });
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            notes: state.notes.map(note =>
              note.id === noteId
                ? { ...note, earnings: (note.earnings || 0) + amount }
                : note
            )
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to record support tip" });
        }
      },
      notes: [],
      trendingNotes: [],
      recommendedNotes: [],
      bookmarkedNotes: [],
      downloadedNotes: [],
      uploadedNotes: [],
      likedNotes: [],
      dislikedNotes: [],
      isLoading: false,
      isTrendingLoading: false,
      isRecommendedLoading: false,
      isBookmarksLoading: false,
      isDownloadsLoading: false,
      isUploadsLoading: false,
      error: null,
      
      updateNote: (note: Note) => {
        set((state) => ({
          notes: state.notes.map(n => n.id === note.id ? note : n)
        }));
      },
      
      fetchNotes: async () => {
        if (get().notes.length > 0) {
          // Only prevent fetch if we already have data and it's not a forced refresh
          return;
        }

        set({ isLoading: true });
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          // Fetch notes with uploader profiles using a left join to ensure we get notes even if profile is missing
          const { data: notes, error } = await supabase
            .from('notes')
            .select(`
              *,
              profiles:uploader_id (
                id,
                name,
                avatar_url,
                is_verified,
                verification_reason
              )
            `)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('[NotesStore] Error fetching notes:', error);
            throw error;
          }

          // Fetch user's likes if authenticated
          let userLikes: { note_id: string }[] = [];
          if (userId) {
            const { data: likes, error: likesError } = await supabase
              .from('likes')
              .select('note_id')
              .eq('user_id', userId);
            
            if (likesError) {
              console.error('[NotesStore] Error fetching likes:', likesError);
              throw likesError;
            }
            
            userLikes = likes || [];
          }

          // Transform the data with fallback for missing profiles
          const formattedNotes = notes.map((note: any) => {
            const profile = note.profiles || {};
            const isLiked = userLikes.some(like => like.note_id === note.id);
            
            return {
              id: note.id,
              title: note.title,
              description: note.description,
              subject: note.subject,
              class: note.class,
              board: note.board,
              topic: note.topic,
              fileType: note.file_type,
              fileUrl: note.file_url,
              thumbnailUrl: note.thumbnail_url,
              uploaderId: note.uploader_id,
              // Fallback to 'Unknown User' if profile data is missing
              uploaderName: profile?.name || 'Unknown User',
              uploaderAvatar: profile?.avatar_url || null,
              uploaderIsVerified: profile?.is_verified || false,
              uploaderVerificationReason: profile?.verification_reason || null,
              likes: note.likes || 0,
              downloads: note.downloads || 0,
              comments: note.comments || 0,
              views: note.views || 0,
              earnings: note.earnings || 0,
              createdAt: note.created_at,
              isLiked,
              isBookmarked: false,
              isDisliked: false,
              adClicks: note.ad_clicks || 0,
              dislikes: note.dislikes?.[0]?.count || 0
            };
          });

          console.log('[NotesStore] Notes loaded:', {
            totalNotes: formattedNotes.length,
            notesWithMissingProfiles: formattedNotes.filter(n => n.uploaderName === 'Unknown User').length
          });

          set({ notes: formattedNotes, isLoading: false });
        } catch (error) {
          console.error('[NotesStore] Error in fetchNotes:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch notes', 
            isLoading: false 
          });
        }
      },
      
      fetchTrendingNotes: async () => {
        set({ isTrendingLoading: true, error: null });
        try {
          // Get all notes
          const { data: notes, error } = await supabase
            .from('notes')
            .select(`
              *,
              uploader:profiles!notes_uploader_id_fkey(name, avatar_url, is_verified, verification_reason),
              dislikes:dislikes(count)
            `)
            .order('created_at', { ascending: false })
            .order('likes', { ascending: false })
            .limit(5);

          if (error) throw error;
          
          // Get current user's likes and dislikes
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;
          
          let userLikes: string[] = [];
          let userDislikes: string[] = [];
          
          if (userId) {
            const [{ data: likes }, { data: dislikes }] = await Promise.all([
              supabase.from('likes').select('note_id').eq('user_id', userId),
              supabase.from('dislikes').select('note_id').eq('user_id', userId)
            ]);
            userLikes = likes?.map(l => l.note_id) || [];
            userDislikes = dislikes?.map(d => d.note_id) || [];
          }

          // Transform data to include uploader info
          const transformedNotes = notes?.map(note => ({
            ...note,
            uploaderName: note.uploader?.name || 'Unknown',
            uploaderAvatar: note.uploader?.avatar_url,
            uploaderId: note.uploader_id, // Use the uploader_id from the note
            thumbnailUrl: note.thumbnail_url || note.uploader?.avatar_url,
            dislikes: note.dislikes?.[0]?.count || 0,
            isLiked: userLikes.includes(note.id),
            isDisliked: userDislikes.includes(note.id)
          })) || [];
          
          set({ trendingNotes: transformedNotes, isTrendingLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to fetch trending notes", isTrendingLoading: false });
        }
      },
      
      fetchRecommendedNotes: async (interests: string[]) => {
        set({ isRecommendedLoading: true, error: null });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('User not authenticated');
          const userId = session.user.id;

          // Get followed users
          const { data: followedUsers, error: followError } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', userId);

          if (followError) throw followError;

          // Get notes from followed users
          const followedUserIds = followedUsers?.map(f => f.following_id) || [];
          
          // Prepare base query with proper joins
          let query = supabase
            .from('notes')
            .select(`
              *,
              profiles!notes_uploader_id_fkey(
                id,
                name,
                avatar_url
              ),
              dislikes:dislikes(count)
            `);

          // Build the filter conditions for interests
          if (interests?.length > 0) {
            const interestFilters = interests.map(interest => {
              const classFilter = `class.ilike.%${interest}%`;
              const subjectFilter = `subject.ilike.%${interest}%`;
              const topicFilter = `topic.ilike.%${interest}%`;
              return `or(${classFilter},${subjectFilter},${topicFilter})`;
            });
            
            // Apply filters
            query = query.or(interestFilters.join(','));
          }

          // Add followed users condition if any
          if (followedUserIds.length > 0) {
            query = query.or(`uploader_id.in.(${followedUserIds.join(',')})`);
          }

          // Order by most recent and most viewed
          query = query.order('created_at', { ascending: false })
                      .order('views', { ascending: false })
                      .limit(20);

          console.log('Executing query:', query);
          const { data, error } = await query;
          
          if (error) {
            console.error('Query error:', error);
            throw error;
          }

          console.log('Raw query results:', data);

          // Transform the data to include uploader details
          const transformedNotes = data?.map(note => ({
            id: note.id,
            title: note.title,
            description: note.description,
            subject: note.subject,
            class: note.class,
            board: note.board,
            topic: note.topic,
            fileType: note.file_type,
            fileUrl: note.file_url,
            thumbnailUrl: note.thumbnail_url,
            uploaderId: note.uploader_id,
            uploaderName: note.profiles?.name || 'Unknown',
            uploaderAvatar: note.profiles?.avatar_url,
            likes: note.likes || 0,
            dislikes: note.dislikes?.[0]?.count || 0,
            downloads: note.downloads || 0,
            comments: note.comments || 0,
            views: note.views || 0,
            adClicks: note.ad_clicks || 0,
            earnings: note.earnings || 0,
            isLiked: false,
            isDisliked: false,
            isBookmarked: false,
            createdAt: note.created_at
          })) || [];
          
          console.log('Transformed notes:', transformedNotes);
          set({ bookmarkedNotes: transformedNotes, isBookmarksLoading: false });
        } catch (error) {
          console.error('Failed to fetch recommended notes:', error);
          set({ error: error instanceof Error ? error.message : "Failed to fetch recommended notes", isLoading: false });
        }
      },
      
      fetchBookmarkedNotes: async () => {
        console.log('Starting fetchBookmarkedNotes');
        set({ isBookmarksLoading: true, error: null });
        
        try {
          const { data: session, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw new Error('Failed to get session');
          }
          
          const userId = session?.session?.user?.id;
          
          if (!userId) {
            console.error('No user ID found in session');
            throw new Error('User not authenticated');
          }

          console.log('Fetching bookmarked notes for user:', userId);
          
          // First, get the note IDs from wishlists
          console.log('Fetching wishlist data...');
          const { data: wishlistData, error: wishlistError } = await supabase
            .from('wishlists')
            .select('note_id')
            .eq('user_id', userId);

          if (wishlistError) {
            console.error('Error fetching wishlist:', wishlistError);
            throw wishlistError;
          }

          console.log('Wishlist data received:', wishlistData);

          if (!wishlistData || wishlistData.length === 0) {
            console.log('No bookmarks found for user');
            set({ bookmarkedNotes: [], isBookmarksLoading: false });
            return;
          }

          const noteIds = wishlistData.map(item => item.note_id);
          console.log('Fetching notes with IDs:', noteIds);

          // Then fetch the actual notes
          console.log('Fetching note details...');
          const { data, error } = await supabase
            .from('notes')
            .select(`
              *,
              uploader:profiles!uploader_id(id, name, avatar_url),
              dislikes:dislikes(count)
            `)
            .in('id', noteIds);

          if (error) {
            console.error('Error fetching notes:', error);
            throw error;
          }

          console.log('Successfully fetched', data?.length, 'notes');
          
          // Transform the data to Note array
          const bookmarked = data?.map((note) => {
            const transformedNote: Note = {
              id: note.id,
              title: note.title,
              description: note.description,
              subject: note.subject,
              class: note.class,
              board: note.board,
              topic: note.topic,
              fileType: note.file_type,
              fileUrl: note.file_url,
              thumbnailUrl: note.thumbnail_url,
              uploaderId: note.uploader_id,
              uploaderName: note.uploader?.name || 'Unknown',
              uploaderAvatar: note.uploader?.avatar_url,
              likes: note.likes || 0,
              dislikes: note.dislikes?.[0]?.count || 0,
              downloads: note.downloads || 0,
              comments: note.comments || 0,
              views: note.views || 0,
              adClicks: note.ad_clicks || 0,
              earnings: note.earnings || 0,
              isLiked: false,
              isDisliked: false,
              isBookmarked: true, // Since this is from wishlists table
              createdAt: note.created_at
            };
            return transformedNote;
          }) || [];
          
          console.log('Transformed bookmarked notes:', bookmarked);
          set({ bookmarkedNotes: bookmarked, isBookmarksLoading: false });
        } catch (error) {
          console.error('Failed to fetch bookmarked notes:', error);
          set({ error: error instanceof Error ? error.message : "Failed to fetch bookmarked notes", isBookmarksLoading: false });
        }
      },
      
      fetchDownloadedNotes: async () => {
        set({ isDownloadsLoading: true, error: null });
        try {
          console.log('Fetching downloaded notes...');
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('Not authenticated');

          // First get the downloads
          const { data: downloads, error: downloadsError } = await supabase
            .from('downloads')
            .select('note_id, downloaded_at')
            .eq('user_id', session.user.id);

          if (downloadsError) {
            console.error('Error fetching downloads:', downloadsError);
            throw downloadsError;
          }

          if (!downloads || downloads.length === 0) {
            set({ downloadedNotes: [], isLoading: false });
            return;
          }

          // Then get the notes with their uploader info
          const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select(`
              *,
              uploader:profiles!uploader_id(id, name, avatar_url),
              dislikes:dislikes(count)
            `)
            .in('id', downloads.map(d => d.note_id));

          if (notesError) {
            console.error('Error fetching notes:', notesError);
            throw notesError;
          }

          // Combine the data
          const transformedNotes = notes?.map(note => {
            const download = downloads.find(d => d.note_id === note.id);
            return {
              ...note,
              uploaderId: note.uploader?.id,
              uploaderName: note.uploader?.name,
              uploaderAvatar: note.uploader?.avatar_url,
              thumbnailUrl: note.thumbnail_url || note.uploader?.avatar_url, // Add thumbnail with fallback
              downloadedAt: download?.downloaded_at,
              dislikes: note.dislikes?.[0]?.count || 0,
            } as Note;
          }) || [];

          console.log('Transformed notes:', transformedNotes);
          set({ downloadedNotes: transformedNotes, isDownloadsLoading: false });
        } catch (error) {
          console.error('Error in fetchDownloadedNotes:', error);
          set({ error: error instanceof Error ? error.message : "Failed to fetch downloaded notes", isDownloadsLoading: false });
        }
      },
      
      fetchUploadedNotes: async (userId?: string) => {
        if (!userId) {
          const { data: session } = await supabase.auth.getSession();
          userId = session?.session?.user?.id;
          if (!userId) throw new Error('Not authenticated');
        }
        set({ isUploadsLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('notes')
            .select(`
              *,
              uploader:uploader_id (
                id,
                name,
                avatar_url,
                is_verified,
                verification_reason
              ),
              dislikes:dislikes(count)
            `)
            .eq('uploader_id', userId)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          
          // Get current user's likes and dislikes
          const { data: session } = await supabase.auth.getSession();
          const currentUserId = session?.session?.user?.id;
          
          let userLikes: string[] = [];
          let userDislikes: string[] = [];
          
          if (currentUserId) {
            const [{ data: likes }, { data: dislikes }] = await Promise.all([
              supabase.from('likes').select('note_id').eq('user_id', currentUserId),
              supabase.from('dislikes').select('note_id').eq('user_id', currentUserId)
            ]);
            userLikes = likes?.map(l => l.note_id) || [];
            userDislikes = dislikes?.map(d => d.note_id) || [];
          }

          // Transform the data to match our Note type
          const transformedNotes = data?.map(note => ({
            id: note.id,
            title: note.title,
            description: note.description,
            subject: note.subject,
            class: note.class,
            board: note.board,
            topic: note.topic,
            fileType: note.file_type,
            fileUrl: note.file_url,
            thumbnailUrl: note.thumbnail_url,
            uploaderId: note.uploader_id,
            uploaderName: note.uploader?.name || 'Unknown',
            uploaderAvatar: note.uploader?.avatar_url,
            uploaderIsVerified: note.uploader?.is_verified || false,
            uploaderVerificationReason: note.uploader?.verification_reason,
            likes: note.likes || 0,
            dislikes: note.dislikes?.[0]?.count || 0,
            downloads: note.downloads || 0,
            comments: note.comments || 0,
            views: note.views || 0,
            adClicks: note.ad_clicks || 0,
            earnings: note.earnings || 0,
            isLiked: userLikes.includes(note.id),
            isDisliked: userDislikes.includes(note.id),
            isBookmarked: false,
            createdAt: note.created_at
          })) || [];
          
          set({ uploadedNotes: transformedNotes, isUploadsLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to fetch uploaded notes", isUploadsLoading: false });
        }
      },
      
      toggleDislike: async (noteId) => {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;
          
          if (!userId) throw new Error('User not authenticated');

          // Check if note is already disliked
          const isDisliked = get().dislikedNotes.some(note => note.id === noteId);
          
          // If adding a dislike, first remove any existing like
          if (!isDisliked) {
            await supabase
              .from('likes')
              .delete()
              .eq('user_id', userId)
              .eq('note_id', noteId);
          }
          
          // Update in database
          const { error } = await supabase
            .from('dislikes')
            [isDisliked ? 'delete' : 'insert']({
              user_id: userId,
              note_id: noteId
            })
            .eq('user_id', userId)
            .eq('note_id', noteId);

          if (error) {
            if (error.code === '23505') { // Unique violation
              // Delete the dislike if it exists
              const { error: deleteError } = await supabase
                .from('dislikes')
                .delete()
                .match({ user_id: userId, note_id: noteId });

              if (deleteError) throw deleteError;
            } else {
              throw error;
            }
          }

          // Get updated dislike count
          const { data: dislikeCount, error: countError } = await supabase
            .from('dislikes')
            .select('id', { count: 'exact' })
            .eq('note_id', noteId);

          if (countError) throw countError;

          // Update all instances of the note in local state
          const updateNoteInArray = (notes: Note[]) =>
            notes.map(note =>
              note.id === noteId
                ? {
                    ...note,
                    isDisliked: !isDisliked,
                    dislikes: dislikeCount?.length || 0,
                    // If disliking, remove like
                    isLiked: !isDisliked ? false : note.isLiked,
                    likes: !isDisliked ? (note.likes > 0 ? note.likes - 1 : 0) : note.likes
                  }
                : note
            );

          set(state => ({
            notes: updateNoteInArray(state.notes),
            trendingNotes: updateNoteInArray(state.trendingNotes),
            recommendedNotes: updateNoteInArray(state.recommendedNotes),
            uploadedNotes: updateNoteInArray(state.uploadedNotes),
            bookmarkedNotes: updateNoteInArray(state.bookmarkedNotes),
            // Update disliked notes collection
            dislikedNotes: isDisliked
              ? state.dislikedNotes.filter(note => note.id !== noteId)
              : [...state.dislikedNotes, state.notes.find(note => note.id === noteId)!],
            // Remove from liked notes if disliking
            likedNotes: !isDisliked
              ? state.likedNotes.filter(note => note.id !== noteId)
              : state.likedNotes
          }));

        } catch (error) {
          console.error('Error in toggleDislike:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to toggle dislike' });
        }
      },
      
      deleteNote: async (noteId) => {
        try {
          set({ isLoading: true, error: null });

          // Get current user
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            console.error('Delete failed: Not authenticated');
            throw new Error('Not authenticated');
          }

          // First delete all related records
          const { error: wishlistError } = await supabase
            .from('wishlists')
            .delete()
            .eq('note_id', noteId);

          if (wishlistError) {
            console.error('Failed to delete wishlist entries:', wishlistError);
          }

          const { error: likesError } = await supabase
            .from('likes')
            .delete()
            .eq('note_id', noteId);

          if (likesError) {
            console.error('Failed to delete like entries:', likesError);
          }

          // Now delete the note
          const { data: likedNotes, error: deleteError } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('uploader_id', session.user.id);

          if (deleteError) {
            console.error('Delete failed:', deleteError);
            throw deleteError;
          }

          console.log('Note deleted successfully:', noteId);

          // Update all note lists in state
          set(state => {
            // Helper to filter out the deleted note
            const filterNote = (notes: Note[] | undefined) => notes?.filter((n: Note) => n.id !== noteId) || [];

            const newState = {
              notes: filterNote(state.notes),
              uploadedNotes: filterNote(state.uploadedNotes),
              bookmarkedNotes: filterNote(state.bookmarkedNotes),
              likedNotes: filterNote(state.likedNotes),
              downloadedNotes: filterNote(state.downloadedNotes),
              trendingNotes: filterNote(state.trendingNotes),
              recommendedNotes: filterNote(state.recommendedNotes),
              isLoading: false
            };
            console.log('State updated after delete');
            return newState;
          });

          // Get current user's interests
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('interests')
            .eq('id', currentSession?.user?.id)
            .single();

          // Refresh all note lists to ensure sync with server
          await Promise.all([
            get().fetchNotes(),
            get().fetchRecommendedNotes(userProfile?.interests || []),
            get().fetchTrendingNotes()
          ]);
        } catch (error) {
          console.error('Delete note error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete note',
            isLoading: false
          });
          throw error;
        }
      },
      
      toggleBookmark: async (noteId) => {
        try {
          console.log('Starting toggleBookmark for note:', noteId);
          const { data: session, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw new Error('Failed to get session');
          }
          
          // Get the user's profile ID instead of auth ID
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session?.session?.user?.id)
            .single();
          
          if (profileError || !profile) {
            console.error('Error fetching profile:', profileError);
            throw new Error('User profile not found');
          }
          
          const userId = profile.id;
          console.log('Using profile ID for wishlist:', userId);
          
          console.log(`Checking for existing bookmark - user: ${userId}, note: ${noteId}`);
          const { data: existingBookmark, error: bookmarkError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('note_id', noteId)
            .maybeSingle();

          if (bookmarkError) {
            console.error('Error checking for existing bookmark:', bookmarkError);
            throw bookmarkError;
          }

          const isBookmarking = !existingBookmark;
          console.log(`Bookmark action: ${isBookmarking ? 'Adding' : 'Removing'}`);

          if (existingBookmark) {
            // Remove bookmark
            console.log('Removing bookmark...');
            const { error } = await supabase
              .from('wishlists')
              .delete()
              .eq('user_id', userId)
              .eq('note_id', noteId);

            if (error) {
              console.error('Error removing bookmark:', error);
              throw error;
            }
            console.log('Bookmark removed successfully');
          } else {
            // Add bookmark
            console.log('Adding new bookmark...');
            const { error } = await supabase
              .from('wishlists')
              .insert([{
                user_id: userId,
                note_id: noteId
              }]);

            if (error) {
              console.error('Error adding bookmark:', error);
              throw error;
            }
            console.log('Bookmark added successfully');
          }

          // Update isBookmarked flag in all note lists
          console.log('Updating local state...');
          set((state) => {
            const updateNoteList = (notes: Note[] = []) => 
              notes.map(note => 
                note.id === noteId 
                  ? { ...note, isBookmarked: isBookmarking }
                  : note
              );
            
            return {
              notes: updateNoteList(state.notes),
              trendingNotes: updateNoteList(state.trendingNotes),
              recommendedNotes: updateNoteList(state.recommendedNotes),
              downloadedNotes: updateNoteList(state.downloadedNotes),
              uploadedNotes: updateNoteList(state.uploadedNotes)
            };
          });

          // Refresh bookmarked notes
          console.log('Refreshing bookmarked notes...');
          await get().fetchBookmarkedNotes();
          console.log('Bookmark toggled successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to toggle bookmark';
          console.error('Error in toggleBookmark:', error);
          set({ error: errorMessage });
          throw error; // Re-throw to allow error handling in the component
        }
      },
      
      toggleLike: async (noteId) => {
        try {
          console.log('[NotesStore] Starting toggleLike:', { noteId });
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            throw new Error('Not authenticated');
          }
          
          const userId = session.user.id;
          console.log('[NotesStore] User authenticated:', { userId });
          
          // Check if note is already liked
          const isLiked = get().likedNotes.some(note => note.id === noteId);
          
          // First, check the current like status in the database
          const { data: existingLike, error: fetchError } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('note_id', noteId)
            .maybeSingle();

          if (fetchError) {
            console.error('[NotesStore] Error checking existing like:', fetchError);
            throw fetchError;
          }

          const isLikedInDb = !!existingLike;
          
          // Update the database
          if (isLiked) {
            // Unlike the note
            const { error } = await supabase
              .from('likes')
              .delete()
              .eq('user_id', userId)
              .eq('note_id', noteId);
            
            if (error) throw error;
            
            // Decrement like count
            await supabase.rpc('decrement_likes', { note_id: noteId });
          } else {
            // Like the note
            const { error } = await supabase
              .from('likes')
              .insert({
                user_id: userId,
                note_id: noteId
              });
            
            if (error) throw error;
            
            // Increment like count
            await supabase.rpc('increment_likes', { note_id: noteId });
          }
          
          // Get updated like count
          const { count, error: countError } = await supabase
            .from('likes')
            .select('id', { count: 'exact' })
            .eq('note_id', noteId);
          
          if (countError) throw countError;
          
          console.log('[NotesStore] Updated like count:', { count });
          
          // Update local state
          set((state) => {
            const updateNote = (note: Note) => 
              note.id === noteId 
                ? { 
                    ...note, 
                    isLiked: !isLiked,
                    likes: count || 0
                  } 
                : note;
            
            return {
              notes: state.notes.map(updateNote),
              trendingNotes: state.trendingNotes.map(updateNote),
              recommendedNotes: state.recommendedNotes.map(updateNote),
              bookmarkedNotes: state.bookmarkedNotes.map(updateNote),
              uploadedNotes: state.uploadedNotes.map(updateNote),
              likedNotes: isLiked 
                ? state.likedNotes.filter(note => note.id !== noteId)
                : [
                    ...state.likedNotes, 
                    {
                      ...state.notes.find(n => n.id === noteId) || 
                      state.trendingNotes.find(n => n.id === noteId) || 
                      state.recommendedNotes.find(n => n.id === noteId) ||
                      state.bookmarkedNotes.find(n => n.id === noteId) ||
                      state.uploadedNotes.find(n => n.id === noteId) ||
                      { id: noteId },
                      isLiked: true,
                      likes: count || 0
                    }
                  ]
            };
          });
          
        } catch (error) {
          console.error('[NotesStore] Error in toggleLike:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to toggle like' });
          throw error;
        }
      },
      
      uploadNote: async (note) => {
        set({ isLoading: true, error: null });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;

          if (!userId) throw new Error('User not authenticated');

          // Create note in database
          const { data, error } = await supabase
            .from('notes')
            .insert([{
              ...note,
              uploader_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) throw error;

          // Update local state
          const transformedNote: Note = {
            id: data.id,
            title: data.title,
            description: data.description,
            subject: data.subject,
            class: data.class,
            board: data.board,
            topic: data.topic,
            language: data.language || 'en',
            file_type: data.file_type as 'image' | 'pdf' | 'doc',
            file_url: data.file_url,
            thumbnail_url: data.thumbnail_url,
            uploader_id: data.uploader_id,
            likes: 0,
            dislikes: 0,
            downloads: 0,
            comments: 0,
            created_at: data.created_at,
            updated_at: data.updated_at,
            isLiked: false,
            isDisliked: false,
            isBookmarked: false
          };

          set((state) => {
            const updatedNotes = [transformedNote, ...state.notes];
            const updatedUploadedNotes = [transformedNote, ...state.uploadedNotes];
            
            return {
              notes: updatedNotes,
              uploadedNotes: updatedUploadedNotes,
              isLoading: false
            };
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to upload note", isLoading: false });
          throw error;
        }
      },
      
      fetchLikedNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('Not authenticated');

          const { data: likes, error: likesError } = await supabase
            .from('likes')
            .select('note_id')
            .eq('user_id', session.user.id);

          if (likesError) throw likesError;

          if (likes && likes.length > 0) {
            const noteIds = likes.map(l => l.note_id);
            const { data: notes, error: notesError } = await supabase
              .from('notes')
              .select('*')
              .in('id', noteIds);

            if (notesError) throw notesError;

            set({ likedNotes: notes || [], isLoading: false });
          } else {
            set({ likedNotes: [], isLoading: false });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch liked notes', isLoading: false });
        }
      },

      downloadNote: async (noteId) => {
        try {
          // Record the download in our downloads table
          const { error: downloadError } = await supabase.rpc('record_download', {
            p_note_id: noteId
          });
          if (downloadError) throw downloadError;

          // Increment note stats with named parameters
          const { error: updateError } = await supabase.rpc('increment_note_stats', {
            note_id: noteId,
            view_increment: 0,
            download_increment: 1,
            ad_click_increment: 1,
            earning_increment: 0.50
          });
          if (updateError) throw updateError;

          // Refresh downloaded notes
          await get().fetchDownloadedNotes();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to download note" });
          throw error;
        }
      },
      
      updateCommentCount: async (noteId: string) => {
        try {
          // Get current comment count
          const { count, error: countError } = await supabase
            .from('comments')
            .select('*', { count: 'exact' })
            .eq('note_id', noteId);
            
          if (countError) throw countError;
      
          // Update the note with the new comment count
          const { error: updateError } = await supabase
            .from('notes')
            .update({ comments: count || 0 })
            .eq('id', noteId);
      
          if (updateError) throw updateError;
      
          // Update all instances of the note in local state
          set((state) => {
            const updateNoteInArray = (notes: Note[]) =>
              notes.map(note =>
                note.id === noteId
                  ? { ...note, comments: count || 0 }
                  : note
              );
      
            return {
              notes: updateNoteInArray(state.notes),
              recommendedNotes: updateNoteInArray(state.recommendedNotes),
              trendingNotes: updateNoteInArray(state.trendingNotes),
              uploadedNotes: updateNoteInArray(state.uploadedNotes),
              bookmarkedNotes: updateNoteInArray(state.bookmarkedNotes)
            };
          });
        } catch (error) {
          console.error('Error updating comment count:', error);
          set({ error: error instanceof Error ? error.message : "Failed to update comment count" });
        }
      },
      rateNote: async (noteId: string, rating: number) => {
        try {
          set({ isLoading: true, error: null });
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) throw new Error('Not authenticated');

          // Insert or update the rating
          const { error } = await supabase
            .from('note_ratings')
            .upsert({
              note_id: noteId,
              user_id: session.session.user.id,
              rating: rating
            });

          if (error) throw error;

          // Update local state
          set(state => ({
            notes: state.notes.map(note =>
              note.id === noteId
                ? { ...note, user_rating: rating }
                : note
            ),
            recommendedNotes: state.recommendedNotes.map(note =>
              note.id === noteId
                ? { ...note, user_rating: rating }
                : note
            ),
            trendingNotes: state.trendingNotes.map(note =>
              note.id === noteId
                ? { ...note, user_rating: rating }
                : note
            ),
            uploadedNotes: state.uploadedNotes.map(note =>
              note.id === noteId
                ? { ...note, user_rating: rating }
                : note
            ),
            bookmarkedNotes: state.bookmarkedNotes.map(note =>
              note.id === noteId
                ? { ...note, user_rating: rating }
                : note
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to rate note',
            isLoading: false 
          });
          throw error;
        }
      },

      fetchUserRating: async (noteId: string) => {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) return null;

          const { data, error } = await supabase
            .from('note_ratings')
            .select('rating')
            .eq('note_id', noteId)
            .eq('user_id', session.session.user.id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') return null; // No rating found
            throw error;
          }

          return data?.rating || null;
        } catch (error) {
          console.error('Error fetching user rating:', error);
          return null;
        }
      },
      refreshNotes: async () => {
        set({ isLoading: true, notes: [] });
        try {
          // Fetch fresh notes with uploader profiles
          const { data: notes, error } = await supabase
            .from('notes')
            .select(`
              *,
              profiles:uploader_id (
                id,
                name,
                avatar_url,
                is_verified,
                verification_reason
              )
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Get current user's session for likes
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          // Fetch user's likes if authenticated
          let userLikes: { note_id: string }[] = [];
          if (userId) {
            const { data: likes } = await supabase
              .from('likes')
              .select('note_id')
              .eq('user_id', userId);
            userLikes = likes || [];
          }

          // Transform the data with fallbacks for missing profiles
          const formattedNotes = notes.map((note: any) => {
            const profile = note.profiles || {};
            const isLiked = userLikes.some(like => like.note_id === note.id);
            
            return {
              id: note.id,
              title: note.title,
              description: note.description,
              subject: note.subject,
              class: note.class,
              board: note.board,
              topic: note.topic,
              fileType: note.file_type,
              fileUrl: note.file_url,
              thumbnailUrl: note.thumbnail_url,
              uploaderId: note.uploader_id,
              // Fallback to 'Unknown User' if profile data is missing
              uploaderName: profile?.name || 'Unknown User',
              uploaderAvatar: profile?.avatar_url || null,
              uploaderIsVerified: profile?.is_verified || false,
              uploaderVerificationReason: profile?.verification_reason || null,
              likes: note.likes || 0,
              downloads: note.downloads || 0,
              comments: note.comments || 0,
              views: note.views || 0,
              earnings: note.earnings || 0,
              createdAt: note.created_at,
              isLiked,
              isBookmarked: false,
              isDisliked: false,
              adClicks: note.ad_clicks || 0,
              dislikes: note.dislikes?.[0]?.count || 0
            };
          });

          console.log('[NotesStore] Refreshed notes:', {
            totalNotes: formattedNotes.length,
            notesWithMissingProfiles: formattedNotes.filter(n => n.uploaderName === 'Unknown User').length
          });

          // Update all note lists
          set({
            notes: formattedNotes,
            trendingNotes: formattedNotes
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 10),
            recommendedNotes: formattedNotes
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .slice(0, 10),
          });

          // Refresh other lists in parallel
          await Promise.all([
            get().fetchBookmarkedNotes(),
            get().fetchLikedNotes(),
            get().fetchDownloadedNotes()
          ]);
        } catch (error) {
          console.error('[NotesStore] Failed to refresh notes:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notes: state.notes,
        bookmarkedNotes: state.bookmarkedNotes,
        uploadedNotes: state.uploadedNotes,
        downloadedNotes: state.downloadedNotes,
        likedNotes: state.likedNotes,
        trendingNotes: state.trendingNotes,
        recommendedNotes: state.recommendedNotes
      })
    }
  )
);