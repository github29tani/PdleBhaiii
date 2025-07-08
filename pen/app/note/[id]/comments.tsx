import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { Send, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { useNotesStore } from '@/store/notes-store';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

interface CommentDetails {
  id: string;
  user_id: string;
  parent_id: string | null;
  reply_count: number;
}

interface CommentRow {
  id: string;
  user_id: string;
  parent_id: string | null;
  reply_count: number | null;
}

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { updateCommentCount } = useNotesStore();

  // Load comments when screen opens
  useEffect(() => {
    loadComments();
  }, [id]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          text,
          user_id,
          created_at,
          parent_id,
          users:user_id (
            name,
            avatar_url
          )
        `)
        .eq('note_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsMap = new Map<string, Comment>();
      const repliesMap = new Map<string, Comment[]>();
      
      const transformedComments: Comment[] = data.map(comment => ({
        id: comment.id,
        text: comment.text,
        userId: comment.user_id,
        userName: comment.users.name,
        userAvatar: comment.users.avatar_url,
        createdAt: comment.created_at,
        parentId: comment.parent_id,
        replies: []
      }));

      // First pass: collect all comments and initialize reply arrays
      transformedComments.forEach(comment => {
        if (!comment.parentId) {
          // This is a parent comment
          commentsMap.set(comment.id, comment);
        } else {
          // This is a reply, store it temporarily
          if (!repliesMap.has(comment.parentId)) {
            repliesMap.set(comment.parentId, []);
          }
          repliesMap.get(comment.parentId)?.push(comment);
        }
      });

      // Second pass: attach replies to their parent comments
      repliesMap.forEach((replies, parentId) => {
        const parentComment = commentsMap.get(parentId);
        if (parentComment) {
          parentComment.replies = replies;
        }
      });

      setComments(Array.from(commentsMap.values()));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          text: newComment,
          user_id: user.id,
          note_id: id,
          parent_id: replyingTo
        })
        .select(`
          id,
          text,
          user_id,
          created_at,
          parent_id,
          users:user_id (
            name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      const newCommentObj: Comment = {
        id: data.id,
        text: data.text,
        userId: data.user_id,
        userName: data.users.name,
        userAvatar: data.users.avatar_url,
        createdAt: data.created_at,
        parentId: data.parent_id,
        replies: []
      };

      if (replyingTo) {
        setComments(comments.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newCommentObj]
            };
          }
          return comment;
        }));
      } else {
        setComments([newCommentObj, ...comments]);
      }

      await updateCommentCount(id as string);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply = false) => {
    try {
      console.log('Starting delete process for comment:', { commentId, isReply });
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session found');
        Alert.alert('Error', 'You must be logged in to delete comments');
        return;
      }
      console.log('User session found:', { userId: session.user.id });

      // Then perform the delete operation
      performDelete(commentId, null, session);
    } catch (error) {
      console.error('Error in delete flow:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const performDelete = async (
    commentId: string, 
    parentId: string | null, 
    session: { user: { id: string } }
  ) => {
    if (!session?.user) {
      console.log('No user session in performDelete');
      return;
    }
    
    try {
      console.log('Starting delete operation:', { commentId, parentId });
      setIsLoading(true);

      // Use the secure RPC function to delete
      const { data, error: deleteError } = await supabase
        .rpc('delete_comment_secure', {
          comment_id_param: commentId,
          user_id_param: session.user.id
        });

      if (deleteError) {
        console.error('Delete error:', deleteError);
        Alert.alert('Error', 'Unable to delete comment');
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.error('Delete failed - no permission');
        Alert.alert('Error', 'You do not have permission to delete this comment');
        setIsLoading(false);
        return;
      }

      console.log('Successfully deleted comment and any replies');

      // Update UI state
      if (parentId) {
        console.log('Updating UI for deleted reply');
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: comment.replies?.filter(reply => reply.id !== commentId) || []
              };
            }
            return comment;
          })
        );
      } else {
        console.log('Updating UI for deleted parent comment');
        setComments(prevComments => 
          prevComments.filter(comment => comment.id !== commentId)
        );
      }

      await updateCommentCount(id as string);
      console.log('Comment count updated');
      Alert.alert('Success', 'Comment deleted successfully');
    } catch (error) {
      console.error('Error in delete operation:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderReply = ({ item }: { item: Comment }) => (
    <View style={[styles.commentContainer, styles.replyContainer]}>
      <Image
        source={{ 
          uri: item.userAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.userName) + '&background=random'
        }}
        style={styles.replyAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
      {user && item.userId === user.id && (
        <TouchableOpacity 
          onPress={() => handleDeleteComment(item.id, true)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View>
      <View style={styles.commentContainer}>
        <Image
          source={{ 
            uri: item.userAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.userName) + '&background=random'
          }}
          style={styles.avatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
          <TouchableOpacity 
            onPress={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
            style={styles.replyButton}
          >
            <Text style={styles.replyButtonText}>
              {replyingTo === item.id ? 'Cancel Reply' : 'Reply'}
            </Text>
          </TouchableOpacity>
        </View>
        {user && item.userId === user.id && (
          <TouchableOpacity 
            onPress={() => handleDeleteComment(item.id)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(reply => renderReply({ item: reply }))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.commentsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
          </View>
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            replyingTo && styles.inputReplying
          ]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        <View style={styles.inputActions}>
          {replyingTo && (
            <TouchableOpacity 
              onPress={() => setReplyingTo(null)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !newComment.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendComment}
            disabled={!newComment.trim()}
          >
            <Send size={20} color={!newComment.trim() ? colors.textTertiary : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 16,
  },
  commentsList: {
    padding: 20,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginRight: 40,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  commentText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: colors.text,
    maxHeight: 100,
    fontSize: 15,
    marginBottom: 8,
  },
  inputReplying: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  replyContainer: {
    marginLeft: 48,
    marginTop: 12,
    marginBottom: 12,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  repliesContainer: {
    marginLeft: 32,
    marginTop: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 16,
  },
  replyButton: {
    marginTop: 12,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});