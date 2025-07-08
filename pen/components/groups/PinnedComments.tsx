import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { Pin, MessageSquare, X, PinOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

type PinnedComment = {
  id: string;
  comment_id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
};

interface PinnedCommentsProps {
  threadId: string;
  isAdmin: boolean;
  onCommentPress?: (commentId: string) => void;
}

export const PinnedComments = ({ threadId, isAdmin, onCommentPress }: PinnedCommentsProps) => {
  const [pinnedComments, setPinnedComments] = useState<PinnedComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPinnedComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_pinned_comments', { thread_id_param: threadId });
      
      if (error) throw error;
      setPinnedComments(data || []);
    } catch (error) {
      console.error('Error fetching pinned comments:', error);
      Alert.alert('Error', 'Failed to load pinned comments');
    } finally {
      setLoading(false);
    }
  };

  const handlePinComment = async (commentId: string, isPinned: boolean) => {
    try {
      if (isPinned) {
        const { error } = await supabase
          .from('pinned_comments')
          .delete()
          .eq('comment_id', commentId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pinned_comments')
          .insert({
            thread_id: threadId,
            comment_id: commentId,
            pinned_by: (await supabase.auth.getUser()).data.user?.id
          });
        
        if (error) throw error;
      }
      
      fetchPinnedComments();
    } catch (error) {
      console.error('Error toggling pin status:', error);
      Alert.alert('Error', 'Failed to update pin status');
    }
  };

  useEffect(() => {
    if (threadId) {
      fetchPinnedComments();
    }
  }, [threadId]);

  if (pinnedComments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        <Pin size={14} color={colors.warning} /> Pinned Comments
      </Text>
      <FlatList
        data={pinnedComments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <View style={styles.userInfo}>
                {item.user_avatar ? (
                  <Image 
                    source={{ uri: item.user_avatar }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {item.user_name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
                <Text style={styles.userName}>{item.user_name}</Text>
              </View>
              {isAdmin && (
                <TouchableOpacity 
                  onPress={() => handlePinComment(item.comment_id, true)}
                  style={styles.pinButton}
                >
                  <PinOff size={16} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            <Text 
              style={styles.commentContent}
              onPress={() => onCommentPress?.(item.comment_id)}
            >
              {item.content}
            </Text>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCard: {
    padding: 12,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  avatarText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  pinButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  separator: {
    height: 8,
  },
});

export default PinnedComments;
