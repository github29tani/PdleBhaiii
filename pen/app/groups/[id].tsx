import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, ActivityIndicator, Image, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { ArrowLeft, Users, Star, MessageSquare, Bookmark, Share2, MoreHorizontal, FileText, MessageCircle, User, Upload, HelpCircle, FileCode2, BrainCircuit, BookOpenCheck, Plus, Pin, PinOff, Heart, Trash2 } from 'lucide-react-native';
import { PinnedComments } from '@/components/groups/PinnedComments';
import CreateThreadModal from './components/CreateThreadModal';
import { ResourceUploadModal } from '@/components/resources/ResourceUploadModel';
import { Share, ActionSheetIOS, Linking } from 'react-native';

type ThreadType = 'DOUBT' | 'FORMULA' | 'CONCEPT' | 'PYQ';

interface DiscussionThread {
  id: string;
  title: string;
  content: string;
  thread_type: ThreadType;
  user_id: string;
  group_id: string;
  is_pinned: boolean;
  comment_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
}

type Group = {
  id: string;
  name: string;
  description: string;
  subject: string;
  type: 'public' | 'private' | 'invite-only';
  member_count: number;
  verified: boolean;
  rating: number;
  created_at: string;
  isUserAdmin: boolean;
};

type TabType = 'discussion' | 'resources' | 'members' | 'career';

interface CareerPost {
  id: string;
  title: string;
  content: string;
  course_name: string;
  scope_description: string;
  industry?: string;
  role?: string;
  experience_level?: 'entry' | 'mid' | 'senior' | 'expert';
  likes: string[];
  likes_count: number;
  points_earned: number;
  rating: number;
  comments_count: number;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
  created_by: string;
};

interface CareerPostFilter {
  industry?: string;
  role?: string;
  experience_level?: string;
  min_rating?: number;
  search?: string;
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const groupId = id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    })();
  }, []);

  const renderCareerPost = ({ item }: { item: CareerPost }) => {
    const isSaved = savedPosts.includes(item.id);
    const isLiked = item.likes.includes(currentUser?.id || '');
    const canDelete = item.created_by === currentUser?.id || group?.isUserAdmin;

    return (
      <Card
        style={styles.careerPostCard}
        onPress={() => {
          setSelectedPost(item);
          setCareerPostModalVisible(true);
        }}
      >
        <View style={styles.careerPostHeader}>
          <View style={styles.careerPostAvatar}>
            <Image
              source={{ uri: item.profiles?.avatar_url }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.careerPostInfo}>
            <Text style={styles.careerPostTitle}>{item.title}</Text>
            <Text style={styles.careerPostMeta}>
              {item.course_name} • {item.industry}
            </Text>
          </View>
          <View style={styles.careerPostActions}>
            <TouchableOpacity
              onPress={() => handleSavePost(item.id)}
              style={[styles.saveButton, isSaved && styles.saved]}
            >
              <Text style={styles.saveButtonText}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
            {canDelete && (
              <TouchableOpacity onPress={() => handleDeleteCareerPost(item.id)} style={styles.deleteButton}>
                <Trash2 size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsText}>
                {item.points_earned} Points
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.careerPostContent}>
          <Text style={styles.careerPostDescription}>
            {item.scope_description}
          </Text>
          <View style={styles.careerPostStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Likes</Text>
              <Text style={styles.statValue}>{item.likes_count}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Comments</Text>
              <Text style={styles.statValue}>{item.comments_count}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rating</Text>
              <Text style={styles.statValue}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderCareerPostModal = () => {
    if (!selectedPost) return null;

    return (
      <Modal
        visible={careerPostModalVisible}
        onRequestClose={() => setCareerPostModalVisible(false)}
        transparent
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPost.title}</Text>
              <TouchableOpacity
                onPress={() => setCareerPostModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalContentText}>
                {selectedPost.content}
              </Text>
              
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Rate this post:</Text>
                <Rating
                  type="custom"
                  ratingCount={5}
                  imageSize={20}
                  showRating={false}
                  onFinishRating={(rating) => handleRatePost(selectedPost.id, rating)}
                />
              </View>

              <View style={styles.modalStats}>
                <Text style={styles.modalStatText}>
                  {selectedPost.likes_count} Likes
                </Text>
                <Text style={styles.modalStatText}>
                  {selectedPost.comments_count} Comments
                </Text>
                <Text style={styles.modalStatText}>
                  Rating: {selectedPost.rating.toFixed(1)}
                </Text>
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>
    );
  };

  const renderCareerFilter = () => {
    return (
      <View style={styles.filterContainer}>
        <TextInput
          placeholder="Search career posts..."
          value={careerPostFilter.search || ''}
          onChangeText={(text) => setCareerPostFilter(prev => ({ ...prev, search: text }))}
          style={styles.searchInput}
        />
        
        <View style={styles.filterOptions}>
          <Picker
            selectedValue={careerPostFilter.industry}
            onValueChange={(itemValue) => setCareerPostFilter(prev => ({ ...prev, industry: itemValue }))}
            style={styles.picker}
          >
            <Picker.Item label="All Industries" value="" />
            <Picker.Item label="Technology" value="technology" />
            <Picker.Item label="Finance" value="finance" />
            <Picker.Item label="Healthcare" value="healthcare" />
            <Picker.Item label="Education" value="education" />
          </Picker>

          <Picker
            selectedValue={careerPostFilter.experience_level}
            onValueChange={(itemValue) => setCareerPostFilter(prev => ({ ...prev, experience_level: itemValue }))}
            style={styles.picker}
          >
            <Picker.Item label="All Levels" value="" />
            <Picker.Item label="Entry" value="entry" />
            <Picker.Item label="Mid" value="mid" />
            <Picker.Item label="Senior" value="senior" />
            <Picker.Item label="Expert" value="expert" />
          </Picker>
        </View>
      </View>
    );
  };
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('discussion');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [discussionThreads, setDiscussionThreads] = useState<DiscussionThread[]>([]);
  const [selectedThreadType, setSelectedThreadType] = useState<ThreadType | 'ALL'>('ALL');
  const [commentInputVisible, setCommentInputVisible] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showCreateThreadModal, setShowCreateThreadModal] = useState(false);
  const [threadCommentsMap, setThreadCommentsMap] = useState<Record<string, any[]>>({});
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [careerPosts, setCareerPosts] = useState<CareerPost[]>([]);
  const [careerPostFilter, setCareerPostFilter] = useState<CareerPostFilter>({});
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [careerPostModalVisible, setCareerPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CareerPost | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [isGroupSaved, setIsGroupSaved] = useState(false);

  useEffect(() => {
    const loadGroupData = async () => {
      try {
        setLoading(true);
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();

        if (groupError) throw groupError;
        if (!groupData) throw new Error('Group not found');

        setGroup(groupData);
        
        // Load career posts
        await fetchCareerPosts();

        // Load discussion threads
        const { data: threads, error: threadsError } = await supabase
          .from('discussion_threads')
          .select('*')
          .eq('group_id', id)
          .order('created_at', { ascending: false });

        if (threadsError) throw threadsError;
        setDiscussionThreads(threads || []);

        // Load members
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('*, profiles:created_by (id, name, avatar_url)')
          .eq('group_id', id)
          .order('created_at', { ascending: false });

        if (membersError) throw membersError;
        setMembers(membersData || []);

        // Load resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .eq('group_id', id)
          .order('created_at', { ascending: false });

        if (resourcesError) throw resourcesError;
        setResources(resourcesData || []);

        // Load saved posts
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: savedPosts } = await supabase
            .from('saved_career_posts')
            .select('career_post_id')
            .eq('user_id', user.id);

          setSavedPosts(savedPosts?.map(post => post.career_post_id) || []);
        }

        // Load user points
        if (user) {
          const { data: pointsData } = await supabase
            .from('user_points')
            .select('points')
            .eq('user_id', user.id)
            .single();

          setPoints(pointsData?.points || 0);
        }

      } catch (error) {
        console.error('Error loading group data:', error);
        Alert.alert('Error', 'Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [id]);

  const handleSavePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isSaved = savedPosts.includes(postId);
      if (isSaved) {
        await supabase
          .from('saved_career_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('career_post_id', postId);
        setSavedPosts(savedPosts.filter(id => id !== postId));
      } else {
        await supabase
          .from('saved_career_posts')
          .insert({ user_id: user.id, career_post_id: postId });
        setSavedPosts([...savedPosts, postId]);
      }
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
    }
  };

  const handleRatePost = async (postId: string, rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('career_post_ratings')
        .upsert({
          user_id: user.id,
          career_post_id: postId,
          rating: rating
        });

      if (error) throw error;

      // Update post's average rating
      const { data: ratings } = await supabase
        .from('career_post_ratings')
        .select('rating')
        .eq('career_post_id', postId);

      const avgRating = ratings?.reduce((sum, r) => sum + r.rating, 0) / ratings?.length || 0;

      await supabase
        .from('career_posts')
        .update({ rating: avgRating })
        .eq('id', postId);

      // Refresh posts
      await fetchCareerPosts();
    } catch (error) {
      console.error('Error rating post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = careerPosts.find(p => p.id === postId);
      if (!post) return;

      const existingLikes: string[] = post.likes ?? [];
      const hasLiked = existingLikes.includes(user.id);
      const updatedLikes = hasLiked
        ? existingLikes.filter((id: string) => id !== user.id)
        : [...existingLikes, user.id];

      // Optimistic UI update
      setCareerPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updatedLikes, likes_count: updatedLikes.length } : p));

      const { error } = await supabase
        .from('career_posts')
        .update({ likes: updatedLikes, likes_count: updatedLikes.length })
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      Alert.alert('Error', 'Failed to update like');
      // TODO: optionally roll back optimistic update
    }
  };

  const fetchCareerPosts = async () => {
    try {
      const query = supabase
        .from('career_posts')
        .select(`
          *,
          profiles:created_by (id, name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (careerPostFilter.industry) {
        query.eq('industry', careerPostFilter.industry);
      }
      if (careerPostFilter.role) {
        query.eq('role', careerPostFilter.role);
      }
      if (careerPostFilter.experience_level) {
        query.eq('experience_level', careerPostFilter.experience_level);
      }
      if (careerPostFilter.min_rating) {
        query.gte('rating', careerPostFilter.min_rating);
      }
      if (careerPostFilter.search) {
        query.ilike('title', `%${careerPostFilter.search}%`);
      }

      // Execute query and capture both data and potential error
      const { data: posts, error } = await query;

      if (error) {
        console.error('Error fetching career posts:', error);
        Alert.alert('Error', error.message);
        return;
      }

      console.log('Fetched career posts:', posts?.length ?? 0);
      setCareerPosts(posts ?? []);
    } catch (err) {
      console.error('Unexpected error fetching career posts:', err);
      Alert.alert('Error', (err as Error).message);
    }
  };
  const [showCreateCareerPostModal, setShowCreateCareerPostModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const threadTypes = [
    { type: 'ALL' as const, label: 'All Threads' },
    { type: 'DOUBT' as const, label: 'Doubt Corner' },
    { type: 'FORMULA' as const, label: 'Formula Sharing' },
    { type: 'CONCEPT' as const, label: 'Concept Discussion' },
    { type: 'PYQ' as const, label: 'Past Year Qs' },
  ];
  
  const handleCreateThread = async (title: string, content: string, type: ThreadType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a thread');
      }
      
      const { data: thread, error } = await supabase
        .from('discussion_threads')
        .insert([
          {
            title,
            content,
            thread_type: type,
            group_id: group?.id,
            user_id: user.id,
            is_pinned: false,
            comment_count: 0,
          },
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Refresh the threads list
      if (group) {
        // Set the selected thread type to the type of the newly created thread.
        // This will trigger the useEffect below to refresh the list.
        setSelectedThreadType(type);
      }
      
      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  };
  
  const getThreadTypeIcon = (type: ThreadType) => {
    switch (type) {
      case 'DOUBT':
        return <HelpCircle size={16} color={colors.primary} style={styles.threadTypeIcon} />;
      case 'FORMULA':
        return <FileCode2 size={16} color={colors.secondary} style={styles.threadTypeIcon} />;
      case 'CONCEPT':
        return <BrainCircuit size={16} color={colors.success} style={styles.threadTypeIcon} />;
      case 'PYQ':
        return <BookOpenCheck size={16} color={colors.warning} style={styles.threadTypeIcon} />;
      default:
        return <MessageSquare size={16} color={colors.text} style={styles.threadTypeIcon} />;
    }
  };

  const getThreadTypeLabel = (type: ThreadType) => {
    switch (type) {
      case 'DOUBT': return 'Doubt Corner';
      case 'FORMULA': return 'Formula Sharing';
      case 'CONCEPT': return 'Concept Discussion';
      case 'PYQ': return 'Past Year Questions';
      default: return 'Discussion';
    }
  };

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch group data WITHOUT heavy join
        const { data: grp, error: grpError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();

        if (grpError) throw grpError;

        // Fetch ONLY the current user's membership row
        const { data: membership, error: memError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();

        if (memError && memError.code !== 'PGRST116') {
          // PGRST116 = Row not found; treat as non-member, not fatal
          throw memError;
        }

        const currentUserRole = membership?.role;
        const isUserAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';

        console.log('Group data:', {
          group_id: grp.id,
          user_id: user.id,
          currentUserRole,
          isUserAdmin,
        });

        setGroup({ ...grp, isUserAdmin });
        // Fetch initial tab data
        fetchTabData(activeTab, grp.id);
      } catch (error) {
        console.error('Error fetching group:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGroup();
    }
  }, [id, activeTab]);

  // Effect to re-fetch discussion threads when the selected type changes
  useEffect(() => {
    if (group && activeTab === 'discussion') {
      fetchTabData('discussion', group.id);
    }
  }, [activeTab, group, selectedThreadType]);

  const fetchTabData = async (tab: TabType, groupId: string) => {
    try {
      switch (tab) {
        case 'discussion':
          console.log('fetchTabData discussion start:', { groupId, selectedThreadType });
          let query = supabase
            .from('discussion_threads')
            .select(`
              *,
              profiles:user_id (id, name, avatar_url)
            `)
            .eq('group_id', groupId);
          
          if (selectedThreadType !== 'ALL') {
            query = query.eq('thread_type', selectedThreadType);
          }
          
          const { data: threads, error } = await query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });
            
          console.log('fetchTabData discussion result:', { threads, error });
          if (error) throw error;
          setDiscussionThreads(threads || []);
          break;
        case 'resources':
          const { data: resources } = await supabase
            .from('resources')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });
          setResources(resources || []);
          break;
        case 'members':
          const { data: members } = await supabase
            .from('group_members')
            .select(`
              *,
              profiles:user_id (id, name, avatar_url)
            `)
            .eq('group_id', groupId);
          setMembers(members || []);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (group) {
      fetchTabData(tab, group.id);
    }
  };

  const handleOpenResource = async (resource: any) => {
    console.log('handleOpenResource called with:', resource);
    
    if (!resource?.file_url) {
      console.error('No file URL provided in resource:', resource);
      Alert.alert('Error', 'No file URL available for this resource');
      return;
    }

    try {
      console.log('Setting loading states');
      setImageLoading(true);
      setImageError(false);
      
      // For non-image files, open in browser directly
      if (!resource.file_type?.startsWith('image/')) {
        console.log('Opening non-image in browser:', resource.file_url);
        await WebBrowser.openBrowserAsync(resource.file_url);
        return;
      }
      
      console.log('Setting selected resource for image display');
      // Create a new object to ensure React detects the state change
      const resourceWithTimestamp = {
        ...resource,
        _timestamp: Date.now() // Add timestamp to force re-render
      };
      
      setSelectedResource(resourceWithTimestamp);
      
    } catch (error) {
      console.error('Error in handleOpenResource:', error);
      setImageError(true);
      Alert.alert(
        'Error Loading Resource',
        error.message || 'Failed to open resource. Please try again.'
      );
    } finally {
      console.log('Clearing loading state');
      setImageLoading(false);
    }
  };

  const renderComment = (comment: any, threadId: string, level = 0) => {
    const marginLeft = level * 16;
    const isReply = level > 0;
    
    return (
      <View 
        key={comment.id} 
        style={[
          styles.commentItem, 
          isReply && styles.replyItem,
          { marginLeft }
        ]}
      >
        <View style={styles.commentHeader}>
          <View style={styles.commentUserInfo}>
            <View style={styles.commentAvatar}>
              <Text style={styles.avatarText}>{comment.user_name?.[0] || 'A'}</Text>
            </View>
            <View style={styles.commentUserDetails}>
              <Text style={styles.commentAuthor}>{comment.user_name || 'Anonymous User'}</Text>
              <Text style={styles.commentTime}>
                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={styles.commentActions}>
            <TouchableOpacity 
              onPress={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                if (commentInputVisible !== threadId) {
                  setCommentInputVisible(threadId);
                }
              }}
              style={styles.replyButton}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteComment(comment.id, threadId)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.commentText}>
          {comment.content}
        </Text>
        {replyingTo === comment.id && (
          <Text style={styles.replyingToText}>
            Replying to {comment.user_name}...
          </Text>
        )}
        
        {/* Render replies if any */}
        {comment.replies?.map((reply: any) => 
          renderComment(reply, threadId, level + 1)
        )}
      </View>
    );
  };

  const processComments = (comments: any[]) => {
    const commentMap = new Map();
    const rootComments: any[] = [];
    
    // First pass: Create a map of all comments
    comments?.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: Build the tree
    commentMap.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });
    
    return rootComments;
  };

  // handleTogglePinComment is defined below

  const loadThreadComments = async (threadId: string) => {
    try {
      console.log('Loading comments for thread:', threadId);
      const { data, error } = await supabase
        .rpc('get_thread_comments', { p_thread_id: threadId });
      
      console.log('RPC get_thread_comments result:', data, error);
      
      if (error) throw error;
      
      // Parse the JSONB response if it's a string
      const comments = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('Processed comments:', comments);
      
      // Process comments into a tree structure and mark pinned comments
      const pinnedComments = await supabase
        .from('pinned_comments')
        .select('comment_id')
        .eq('thread_id', threadId);
      
      const pinnedCommentIds = new Set(pinnedComments.data?.map(pc => pc.comment_id) || []);
      
      const commentsWithPinned = comments.map((comment: any) => ({
        ...comment,
        is_pinned: pinnedCommentIds.has(comment.id)
      }));
      
      const processedComments = processComments(commentsWithPinned);
      
      console.log('Updating threadCommentsMap with new data');
      setThreadCommentsMap(prev => ({
        ...prev,
        [threadId]: processedComments || []
      }));
    } catch (err: any) {
      console.error('Error loading thread comments:', err);
      Alert.alert('Error', err.message || 'Failed to load comments');
    }
  };

  const handleReply = async (parentCommentId: string, threadId: string) => {
    if (!commentText.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to reply');
      }
      
      const commentData: any = {
        content: commentText,
        thread_id: threadId,
        user_id: user.id,
      };

      // If replying to a comment, add parent_comment_id
      if (replyingTo) {
        commentData.parent_comment_id = replyingTo;
      }

      console.log('Submitting comment:', commentData);
      const { error } = await supabase
        .from('thread_comments')
        .insert([commentData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Reset form and refresh comments
      setCommentText('');
      setReplyingTo(null);
      await loadThreadComments(threadId);
    } catch (err: any) {
      console.error('Error replying to comment:', err);
      Alert.alert('Error', err.message || 'Failed to post reply');
    }
  };

  const handleTogglePinComment = async (commentId: string, threadId: string, pin: boolean) => {
    try {
      const { data, error } = await supabase
        .from('thread_comments')
        .update({ is_pinned: pin })
        .eq('id', commentId)
        .select();

      if (error) {
        console.error('Error toggling pin status:', error);
        throw error;
      }

      // Refresh the comments to show the updated pin status
      await loadThreadComments(threadId);
      
      Alert.alert(
        pin ? 'Comment Pinned' : 'Comment Unpinned',
        pin ? 'The comment has been pinned to the top.' : 'The comment has been unpinned.'
      );
    } catch (err: any) {
      console.error('Error in handleTogglePinComment:', err);
      Alert.alert('Error', err.message || 'Failed to update pin status');
    }
  };

  const handleDeleteComment = async (commentId: string, threadId: string) => {
    console.log('Attempting to delete comment:', { commentId, threadId });
    try {
      const { data, error } = await supabase
        .from('thread_comments')
        .delete()
        .eq('id', commentId)
        .select();

      console.log('Delete response:', { data, error });

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      console.log('Comment deleted, refreshing comments...');
      // Refresh the comments after deletion
      await loadThreadComments(threadId);
      console.log('Comments refreshed after deletion');
    } catch (err: any) {
      console.error('Error in handleDeleteComment:', err);
      Alert.alert('Error', err.message || 'Failed to delete comment');
    }
  };

  const renderThreadCommentsTree = (comments: any[], threadId: string) => {
    const commentMap = new Map<string, any>();
    const roots: any[] = [];
    comments.forEach(c => { c.replies = []; commentMap.set(c.id, c); });
    comments.forEach(c => {
      if (c.parent_comment_id) {
        const parent = commentMap.get(c.parent_comment_id);
        if (parent) parent.replies.push(c);
        else roots.push(c);
      } else roots.push(c);
    });

    const renderNode = (c: any, level: number) => {
      const isPinned = c.is_pinned;
      const isAdmin = group?.isUserAdmin;
      
      return (
        <View 
          key={c.id} 
          id={`comment-${c.id}`}
          style={[styles.commentContainer, isPinned && styles.pinnedCommentContainer]}
        >
          {isPinned && (
            <View style={styles.pinnedBadge}>
              <Pin size={12} color={colors.warning} fill={colors.warning} />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}
          <View style={styles.commentHeader}>
            <View style={styles.commentUserInfo}>
              {c.user_avatar ? (
                <Image 
                  source={{ uri: c.user_avatar }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {c.user_name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              <Text style={styles.commentUsername}>{c.user_name || 'Anonymous'}</Text>
            </View>
            <View style={styles.commentActions}>
              <Text style={styles.commentTime}>
                {new Date(c.created_at).toLocaleString()}
              </Text>
              {isAdmin && (
                <TouchableOpacity 
                  onPress={() => handleTogglePinComment(c.id, threadId, !isPinned)}
                  style={styles.pinButton}
                >
                  {isPinned ? (
                    <PinOff size={16} color={colors.danger} />
                  ) : (
                    <Pin size={16} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => {
                  setReplyingTo(replyingTo === c.id ? null : c.id);
                  setCommentText(`@${c.user_name} `);
                }}
                style={styles.commentAction}
              >
                <Text style={styles.commentActionText}>
                  {replyingTo === c.id ? 'Cancel' : 'Reply'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.commentText}>{c.content}</Text>
          
          {replyingTo === c.id && (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write your reply..."
                placeholderTextColor="#888"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity 
                style={[styles.replyButton, { backgroundColor: colors.primary }]}
                onPress={() => handleReply(c.id, threadId)}
              >
                <Text style={styles.replyButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {c.replies?.length > 0 && (
            <View style={styles.repliesContainer}>
              {c.replies.map((reply: any) => renderNode(reply, level + 1))}
            </View>
          )}
        </View>
      );
    };
    
    return (
      <View style={styles.commentsContainer}>
        <PinnedComments 
          threadId={threadId} 
          isAdmin={group?.isUserAdmin || false}
          onCommentPress={(commentId) => {
            const commentElement = document.getElementById(`comment-${commentId}`);
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
        {roots.map(c => renderNode(c, 0))}
      </View>
    );
  };

  const renderCareerContent = () => {
  return (
    <View style={styles.tabContent}>
      {/* Create Post Button */}
      <TouchableOpacity 
        style={styles.createPostButton}
        onPress={() => setShowCreateCareerPostModal(true)}
      >
        <Plus size={24} color={colors.background} />
        <Text style={styles.createPostButtonText}>Share Your Career Journey</Text>
      </TouchableOpacity>

      {/* Career Posts List */}
      {careerPosts.length > 0 ? (
        <FlatList
          data={careerPosts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.careerPostCard}>
              <View style={styles.careerPostHeader}>
                <Image 
                  source={{ uri: item.profiles.avatar_url }}
                  style={styles.careerPostAvatar}
                />
                <View style={styles.careerPostInfo}>
                  <Text style={styles.careerPostTitle}>{item.title}</Text>
                  <Text style={styles.careerPostCourse}>{item.course_name}</Text>
                </View>
              </View>
              <Text style={styles.careerPostContent}>{item.content}</Text>
              <Text style={styles.careerPostScope}>{item.scope_description}</Text>
              <View style={styles.careerPostFooter}>
                <TouchableOpacity 
                  style={styles.likeButton}
                  onPress={() => handleLikePost(item.id)}
                >
                  <Heart size={20} color={item.likes_count > 0 ? '#6C5CE7' : colors.text} />
                  <Text style={styles.careerPostLikes}>
                    {item.likes_count} likes
                  </Text>
                </TouchableOpacity>
                <Text style={styles.rewardsText}>
                  +{item.likes_count * 5} points
                </Text>
              </View>
            </Card>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <BrainCircuit size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            No career journeys shared yet
          </Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => setShowCreateCareerPostModal(true)}
          >
            <Text style={styles.emptyStateButtonText}>
              Share Your Journey
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const renderTabContent = () => {
    switch (activeTab) {
      case 'discussion':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.threadTypeContainer}
                contentContainerStyle={styles.threadTypeScrollContent}
              >
              {threadTypes.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.threadTypeButton,
                    selectedThreadType === item.type && styles.threadTypeButtonActive
                  ]}
                  onPress={() => setSelectedThreadType(item.type)}
                >
                  <Text 
                    style={[
                      styles.threadTypeText,
                      selectedThreadType === item.type && styles.threadTypeTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.createThreadButton}
                onPress={() => setShowCreateThreadModal(true)}
              >
                <Plus size={20} color={colors.secondary} />
                <Text style={styles.createThreadButtonText}>New</Text>
              </TouchableOpacity>
            </View>
            {discussionThreads.length > 0 ? (
              <FlatList
                data={discussionThreads}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Card style={{
                    ...styles.threadCard,
                    ...(item.is_pinned ? styles.pinnedThread : {})
                  }}>
                    <View style={styles.threadHeader}>
                      <View style={styles.threadTypeBadge}>
                        {getThreadTypeIcon(item.thread_type)}
                        <Text style={styles.threadTypeText}>
                          {getThreadTypeLabel(item.thread_type)}
                        </Text>
                      </View>
                      {item.is_pinned && (
                        <View style={styles.pinnedBadge}>
                          <Bookmark size={12} color={colors.warning} fill={colors.warning} />
                          <Text style={styles.pinnedText}>Pinned</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.threadTitle}>{item.title}</Text>
                    <Text style={styles.threadContent} numberOfLines={2}>{item.content}</Text>
                    <View style={styles.threadFooter}>
                      <View style={styles.userInfo}>
                        {item.profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: item.profiles.avatar_url }} 
                            style={styles.avatar} 
                          />
                        ) : (
                          <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                              {item.profiles?.name?.charAt(0) || 'U'}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.userName}>
                          {item.profiles?.name || 'Anonymous'}
                        </Text>
                      </View>
                      <View style={styles.threadMeta}>
                        <Text style={styles.threadMetaText}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                        <TouchableOpacity 
                        style={styles.commentCount}
                        onPress={() => {
                          console.log('toggle comment input for thread', item.id);
                          const newId = commentInputVisible === item.id ? null : item.id;
                          setCommentInputVisible(newId);
                          if (newId) loadThreadComments(item.id);
                        }}
                      >
                        <MessageSquare size={14} color={colors.textSecondary} />
                        <Text style={styles.threadMetaText}>
                          {item.comment_count || 0}
                        </Text>
                      </TouchableOpacity>
                      </View>
                    </View>
                    
                    {commentInputVisible === item.id && (
                      <View style={styles.commentInputContainer}>
                        {/* Thread comments list */}
                        {Array.isArray(threadCommentsMap[item.id]) && threadCommentsMap[item.id].map((comment: any) => (
                          renderComment(comment, item.id)
                        ))}
                        <TextInput
                          style={styles.commentInput}
                          placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
                          placeholderTextColor="#888"
                          value={newComment}
                          onChangeText={setNewComment}
                          multiline
                        />
                        <TouchableOpacity 
                          style={styles.commentButton}
                          onPress={() => handleThreadCommentSubmit(item.id)}
                        >
                          <Text style={styles.commentButtonText}>Post</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <MessageCircle size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No discussion threads yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to start a discussion</Text>
              </View>
            )}
          </View>
        );
      case 'resources':
        return (
          <View style={styles.tabContent}>
            <View style={styles.resourcesHeader}>
              <Text style={styles.sectionTitle}>Resources</Text>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => setShowUploadModal(true)}
              >
                <Upload size={16} color="white" style={{ marginRight: 4 }} />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
            
            {resources.length > 0 ? (
              <FlatList
                data={resources}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleOpenResource(item)}>
                    <Card style={styles.resourceCard}>
                      <View style={styles.resourceHeader}>
                        <FileText size={20} color={colors.primary} />
                        <Text style={styles.resourceTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={styles.resourceDescription} numberOfLines={2}>
                        {item.description || 'No description'}
                      </Text>
                      <Text style={styles.resourceMeta}>
                        {new Date(item.created_at).toLocaleDateString()} • {item.file_type || 'File'}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <FileText size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No resources yet</Text>
                <TouchableOpacity 
                  style={styles.uploadPromptButton}
                  onPress={() => setShowUploadModal(true)}
                >
                  <Text style={styles.uploadPromptText}>Upload your first resource</Text>
                </TouchableOpacity>
              </View>
            )}

            {group && (
              <ResourceUploadModal
                groupId={group.id}
                isVisible={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadSuccess={() => {
                  if (group) {
                    fetchTabData('resources', group.id);
                  }
                  setShowUploadModal(false);
                }}
              />
            )}
            
            {selectedResource && (
              <Modal
                visible={!!selectedResource}
                animationType="slide"
                onRequestClose={() => setSelectedResource(null)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {selectedResource.title}
                    </Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setSelectedResource(null)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {selectedResource.file_type?.startsWith('image/') && (
                    <View style={styles.imageContainer}>
                      <Image 
                        key={`image-${selectedResource._timestamp || '0'}`} // Force re-render with new key
                        source={{ 
                          uri: selectedResource.file_url,
                          cache: 'force-cache',
                          headers: {
                            'Cache-Control': 'max-age=3600',
                          },
                        }}
                        style={styles.imagePreview}
                        resizeMode="contain"
                        onLoadStart={() => {
                          console.log('Image load started');
                          setImageLoading(true);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully');
                          setImageLoading(false);
                          setImageError(false);
                        }}
                        onError={(e) => {
                          console.error('Image load error:', e.nativeEvent.error);
                          setImageError(true);
                          setImageLoading(false);
                          Alert.alert(
                            'Error Loading Image',
                            'The image could not be loaded. Please try again.'
                          );
                        }}
                      />
                      
                      {imageError && (
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>Failed to load image</Text>
                          <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={() => handleOpenResource(selectedResource)}
                          >
                            <Text style={styles.retryButtonText}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {imageLoading && (
                        <View style={styles.loadingOverlay}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.loadingText}>Loading image...</Text>
                        </View>
                      )}
                    </View>
                  )} else {
                    <View style={styles.unsupportedContainer}>
                      <FileText size={48} color={colors.textSecondary} />
                      <Text style={styles.unsupportedText}>
                        Preview not available for this file type
                      </Text>
                      <TouchableOpacity 
                        style={styles.openInBrowserButton}
                        onPress={() => selectedResource?.file_url && WebBrowser.openBrowserAsync(selectedResource.file_url)}
                      >
                        <Text style={styles.openInBrowserText}>Open in Browser</Text>
                      </TouchableOpacity>
                    </View>
                  }
                </View>
              </Modal>
            )}
          </View>
        );
      case 'members':
        return (
          <View style={styles.tabContent}>
            {members.length > 0 ? (
              <FlatList
                data={members}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.memberItem}
                    onPress={() => router.push(`/user/${item.user_id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.memberAvatar}>
                      <User size={20} color={colors.background} />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {item.profiles?.name || 'Unknown User'}
                      </Text>
                      <Text style={styles.memberRole}>
                        {item.role || 'Member'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Users size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No members yet</Text>
                <Text style={styles.emptyStateSubtext}>Invite others to join</Text>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  // Submit a comment for a discussion thread
  const handleThreadCommentSubmit = async (threadId: string) => {
    if (!newComment.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to comment');
      
      const commentData: any = {
        content: newComment,
        thread_id: threadId,
        user_id: user?.id,
      };

      // If replying to a comment, add parent_comment_id
      if (replyingTo) {
        commentData.parent_comment_id = replyingTo;
      }

      console.log('Submitting comment:', commentData);
      const { error } = await supabase
        .from('thread_comments')
        .insert([commentData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Reset form and refresh comments
      setNewComment('');
      setReplyingTo(null);
      await loadThreadComments(threadId);
    } catch (err: any) {
      console.error('Error posting comment:', err);
      Alert.alert('Error', err.message || 'Failed to post comment');
      setCommentInputVisible(null);
    }
  };

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCourse, setNewPostCourse] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmittingCareerPost, setIsSubmittingCareerPost] = useState(false);

  const handleCreateCareerPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not logged in', 'Please log in to share a post.');
        return;
      }
      
      if (!newPostTitle.trim() || !newPostContent.trim()) {
        Alert.alert('Missing Info', 'Please fill in title and content.');
        return;
      }

      // Log user and group info
      console.log('Current user info:', {
        userId: user.id,
        email: user.email,
        group_id: id
      });

      // Check if user is creator of the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', id)
        .single();

      console.log('Group creator info:', {
        groupData,
        groupError,
        isCreator: groupData?.created_by === user.id
      });

      // First, verify the user is a member of the group
      console.log('Checking group membership for user:', user.id, 'in group:', id);
      
      // First, try to get the user's membership with detailed logging
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', id)
        .eq('user_id', user.id);

      console.log('Membership check result:', { 
        membership,
        membershipError,
        membershipCount: membership?.length || 0 
      });

      // Debug: Check all members of the group
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', id);
      
      console.log('All members of group:', {
        allMembers,
        memberCount: allMembers?.length || 0
      });

      if (membershipError) {
        console.error('Error checking membership:', {
          error: membershipError,
          message: membershipError.message,
          code: membershipError.code
        });
        throw new Error('Error verifying group membership');
      }

      if (!membership || membership.length === 0) {
        console.log('User is not a member:', {
          userId: user.id,
          groupId: id,
          membership: membership
        });
        throw new Error('You must be a member of this group to post. Please join the group first.');
      }

      setIsSubmittingCareerPost(true);

      const postData = {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        group_id: id,
        created_by: user.id,
        course_name: newPostCourse.trim() || null,
        scope_description: null,
        industry: null,
        role: null,
        experience_level: null,
        likes: [],
        likes_count: 0,
        points_earned: 0,
        rating: 0,
        comments_count: 0,
        is_saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error } = await supabase
        .from('career_posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      // Reset form and close modal
      setNewPostTitle('');
      setNewPostCourse('');
      setNewPostContent('');
      setShowCreateCareerPostModal(false);

      // Refresh the posts list
      await fetchCareerPosts();
    } catch (err: any) {
      console.error('Error creating career post:', err);
      Alert.alert('Error', err.message || 'Could not share post');
    } finally {
      setIsSubmittingCareerPost(false);
    }
  };

  const handleDeleteCareerPost = async (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('career_posts')
              .delete()
              .eq('id', postId);

            if (error) throw error;
            await fetchCareerPosts();
          } catch (err: any) {
            console.error('Error deleting post:', err);
            Alert.alert('Error', err.message || 'Failed to delete post');
          }
        },
      },
    ]);
  };

  const handleShareGroup = async () => {
    try {
      const link = `https://your-app-domain.com/groups/${id}`;
      await Share.share({
        message: `Join ${group?.name} mentor circle: ${link}`,
        url: link,
        title: group?.name,
      });
    } catch (err) {
      console.error('Error sharing group', err);
    }
  };

  const handleBookmarkGroup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Alert.alert('Please login to save');

      if (isGroupSaved) {
        await supabase.from('saved_groups').delete().eq('user_id', user.id).eq('group_id', id);
      } else {
        await supabase.from('saved_groups').insert({ user_id: user.id, group_id: id });
      }
      setIsGroupSaved(!isGroupSaved);
    } catch (error) {
      console.error('Error saving group', error);
    }
  };

  const handleMoreActions = () => {
    const options = ['Copy Link', isGroupSaved ? 'Unsave Group' : 'Save Group', 'Cancel'];
    const cancel = 2;

    const onSelect = (index: number) => {
      switch (index) {
        case 0:
          Clipboard.setString(Linking.createURL(`/groups/${id}`));
          Alert.alert('Link copied');
          break;
        case 1:
          handleBookmarkGroup();
          break;
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: cancel }, onSelect);
    } else {
      Alert.alert('Actions', '', [
        { text: options[0], onPress: () => onSelect(0) },
        { text: options[1], onPress: () => onSelect(1) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBookmarkGroup}>
            <Bookmark size={24} color={isGroupSaved ? colors.primary : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleShareGroup}>
            <Share2 size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleMoreActions}>
            <MoreHorizontal size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pinned Messages Section */}

      {/* Group Info */}
      <ScrollView style={styles.content}>
        <Card style={styles.groupInfo}>
          <Text style={styles.groupDescription}>{group.description}</Text>
          
          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <Users size={20} color={colors.primary} />
              <Text style={styles.metaText}>{group.member_count} members</Text>
            </View>
            <View style={styles.metaItem}>
              <Star size={20} color={colors.primary} />
              <Text style={styles.metaText}>{group.rating}/5</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.groupType, { color: colors.primary }]}>
                {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'discussion' && styles.activeTab]}
            onPress={() => handleTabChange('discussion')}
          >
            <MessageSquare size={16} color={activeTab === 'discussion' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'discussion' && styles.activeTabText]}>
              Discussion
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
            onPress={() => handleTabChange('resources')}
          >
            <FileText size={16} color={activeTab === 'resources' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
              Resources
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => handleTabChange('members')}
          >
            <Users size={16} color={activeTab === 'members' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
              Members
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'career' && styles.activeTab]}
            onPress={() => handleTabChange('career')}
          >
            <BrainCircuit size={16} color={activeTab === 'career' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'career' && styles.activeTabText]}>
              Career
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'career' ? renderCareerContent() : renderTabContent()}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <MessageSquare size={24} color={colors.background} />
      </TouchableOpacity>
      {/* Modals */}
      {group && (
        <>
          <CreateThreadModal
            visible={showCreateThreadModal}
            onClose={() => setShowCreateThreadModal(false)}
            onSubmit={handleCreateThread}
            groupId={group.id}
          />
          <ResourceUploadModal
            groupId={group.id}
            isVisible={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadSuccess={() => {
              if (group) {
                fetchTabData('resources', group.id);
              }
              setShowUploadModal(false);
            }}
          />
          <Modal
            visible={showCreateCareerPostModal}
            animationType="slide"
            onRequestClose={() => setShowCreateCareerPostModal(false)}
            transparent={false}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Share Your Career Journey</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Title*"
                placeholderTextColor={colors.textSecondary}
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Course / Degree"
                placeholderTextColor={colors.textSecondary}
                value={newPostCourse}
                onChangeText={setNewPostCourse}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Tell your journey...*"
                placeholderTextColor={colors.textSecondary}
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowCreateCareerPostModal(false)}
                  disabled={isSubmittingCareerPost}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.button }]}
                  onPress={handleCreateCareerPost}
                  disabled={isSubmittingCareerPost}
                >
                  {isSubmittingCareerPost ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: colors.background }]}>Share</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  createPostButtonText: {
    color: colors.background,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  careerPostCard: {
    backgroundColor: '#262626',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  careerPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4CB4E0',
  },
  careerPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CB4E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  careerPostInfo: {
    flex: 1,
  },
  careerPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  careerPostCourse: {
    fontSize: 14,
    color: '#4CB4E0',
    marginBottom: 8,
  },
  careerPostContent: {
    padding: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  careerPostScope: {
    padding: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  careerPostFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#4CB4E0',
  },
  careerPostLikes: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  likeIcon: {
    marginRight: 4,
  },
  rewardsText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 10,
  },
  errorText: {
    color: colors.error,
    marginTop: 10,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text,
    fontSize: 16,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  unsupportedText: {
    marginTop: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  openInBrowserButton: {
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  openInBrowserText: {
    color: '#fff',
    fontWeight: '600',
  },
  resourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  uploadPromptButton: {
    marginTop: 8,
    padding: 8,
  },
  uploadPromptText: {
    color: colors.primary,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  groupInfo: {
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    color: colors.text,
    fontSize: 14,
  },
  groupType: {
    textTransform: 'capitalize',
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: 16,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    marginLeft: 6,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  threadTypeContainer: {
    flex: 1,
    maxHeight: 50,
  },
  createThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  createThreadButtonText: {
    color: colors.secondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  threadTypeScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  threadTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background + '80',  // 50% opacity
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  threadTypeButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  threadTypeText: {
    fontSize: 12,
    color: colors.text,
  },
  threadTypeTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  threadTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  threadTypeIcon: {
    marginRight: 4,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinnedThread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinnedText: {
    color: colors.warning,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // avatarText style is defined below
  userName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyStateSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  threadCard: {
    padding: 16,
    marginBottom: 12,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  threadContent: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInputContainer: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  // commentHeader style is defined below
  commentAuthor: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#2a3a4a',
  },
  replyButtonText: {
    color: '#7ab1ff',
    fontSize: 12,
    paddingHorizontal: 6,
  },
  // replyingToText style is defined below
  commentTime: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 2,
  },
  commentInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 0, // Remove border
    minHeight: 40,
    maxHeight: 120,
    padding: 12,
    textAlignVertical: 'top',
    color: '#ffffff',
    fontSize: 14,
  },
  commentButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4CB4E0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  commentButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  replyingToText: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
    marginTop: -2,
  },
  commentItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#008ECC', // App's blue color
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  replyItem: {
    backgroundColor: '#262626',
    borderLeftColor: '#4CB4E0', // App's lighter blue variant
    marginTop: 16,
    paddingLeft: 12,
    marginLeft: 12,
    borderLeftWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CB4E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  threadComment: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  threadMetaText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginRight: 12,
  },
  resourceCard: {
    padding: 16,
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resourceMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  threadComment: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  commentText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Pinned comments styles
  pinnedCommentContainer: {
    backgroundColor: 'rgba(0, 142, 204, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 142, 204, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  pinnedBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pinButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  commentContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  replyInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    color: colors.text,
  },
  replyButton: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  viewRepliesButton: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  replyContainer: {
    marginLeft: 16,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: 12,
  },
  pinnedCommentsContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  pinnedCommentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noPinnedComments: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  commentAction: {
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  commentActionText: {
    color: '#4CB4E0',
    fontSize: 12,
    fontWeight: '500',
  },
  replyInputContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#2a3a4a',
    paddingLeft: 12,
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  replyInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 8,
  },
  replyButton: {
    backgroundColor: '#4CB4E0',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  danger: {
    color: '#ff4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    marginBottom: 12,
  },
  modalTextarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalCancelButton: {
    backgroundColor: colors.surface,
  },
  modalButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
});
