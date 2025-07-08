import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '@/constants/colors';
import { X, Users, Mic, Video, BadgeCheck, Award, Bell, UserPlus, UserMinus } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import moment from 'moment';
import { PinnedMessages } from './PinnedMessages';
import { Poll } from './Poll';

// Group types
type Group = {
  id: string;
  name: string;
  description: string;
  subject: string;
  type: 'public' | 'private' | 'invite-only';
  member_count: number;
  created_at: string;
  admin_id: string;
  last_updated: string;
};

type Thread = {
  id: string;
  title: string;
  type: 'doubt' | 'formula' | 'concept' | 'past-year';
  message_count: number;
  last_updated: string;
};

// Group component
export function Group({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient();
  const [createThreadModal, setCreateThreadModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadType, setThreadType] = useState<'doubt' | 'formula' | 'concept' | 'past-year'>('doubt');

  // Fetch group details
  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      
      if (error) throw error;
      return data as Group;
    }
  });

  // Fetch threads
  const { data: threads } = useQuery({
    queryKey: ['threads', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('group_id', groupId)
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      return data as Thread[];
    }
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: { title: string; type: string }) => {
      const { error } = await supabase
        .from('threads')
        .insert({
          group_id: groupId,
          title: data.title,
          type: data.type,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['threads', groupId]);
      setCreateThreadModal(false);
      setThreadTitle('');
    },
  });

  // Handle thread creation
  const handleCreateThread = () => {
    if (!threadTitle.trim()) {
      Alert.alert('Error', 'Please enter a thread title');
      return;
    }
    createThreadMutation.mutate({ title: threadTitle, type: threadType });
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      {/* Group Header */}
      <Card style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.subject}>{group.subject}</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Users size={16} color={colors.text} />
              <Text style={styles.statText}>{group.member_count} members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.typeText}>{group.type === 'public' ? 'Public' : group.type === 'private' ? 'Private' : 'Invite Only'}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Pinned Messages */}
      <PinnedMessages groupId={groupId} />

      {/* Polls */}
      <Poll groupId={groupId} />

      {/* Thread List */}
      <ScrollView style={styles.threadsContainer}>
        {threads?.map((thread) => (
          <Card key={thread.id} style={styles.threadCard}>
            <View style={styles.threadHeader}>
              <Text style={styles.threadTitle}>{thread.title}</Text>
              <Text style={styles.threadType}>
                {thread.type === 'doubt' && '📌 Doubt Corner'}
                {thread.type === 'formula' && '📝 Formula Sharing'}
                {thread.type === 'concept' && '🤔 Concept Discussion'}
                {thread.type === 'past-year' && '📚 Past Year Questions'}
              </Text>
            </View>
            <View style={styles.threadStats}>
              <Text style={styles.statText}>
                {thread.message_count} messages • {thread.last_updated ? new Date(thread.last_updated).toLocaleString() : 'Just now'}
              </Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Create Thread Button */}
      <TouchableOpacity
        style={styles.createThreadButton}
        onPress={() => setCreateThreadModal(true)}
      >
        <Text style={styles.createThreadButtonText}>Create Thread</Text>
      </TouchableOpacity>

      {/* Create Thread Modal */}
      <Modal
        visible={createThreadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateThreadModal(false)}
      >
        <Card style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Thread</Text>
            <TouchableOpacity onPress={() => setCreateThreadModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.threadTitleInput}
            placeholder="Enter thread title"
            value={threadTitle}
            onChangeText={setThreadTitle}
          />
          
          <View style={styles.threadTypeSelector}>
            <TouchableOpacity
              style={[styles.threadTypeButton, threadType === 'doubt' && styles.selected]}
              onPress={() => setThreadType('doubt')}
            >
              <Text style={styles.threadTypeText}>Doubt Corner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.threadTypeButton, threadType === 'formula' && styles.selected]}
              onPress={() => setThreadType('formula')}
            >
              <Text style={styles.threadTypeText}>Formula Sharing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.threadTypeButton, threadType === 'concept' && styles.selected]}
              onPress={() => setThreadType('concept')}
            >
              <Text style={styles.threadTypeText}>Concept Discussion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.threadTypeButton, threadType === 'past-year' && styles.selected]}
              onPress={() => setThreadType('past-year')}
            >
              <Text style={styles.threadTypeText}>Past Year Questions</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateThread}
          >
            <Text style={styles.createButtonText}>Create Thread</Text>
          </TouchableOpacity>
        </Card>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subject: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  typeText: {
    color: colors.text,
    fontSize: 14,
  },
  threadsContainer: {
    marginBottom: 100,
  },
  threadCard: {
    marginBottom: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  threadType: {
    fontSize: 14,
    color: colors.primary,
  },
  threadStats: {
    alignItems: 'flex-end',
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  createThreadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createThreadButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    margin: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  threadTitleInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  threadTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  threadTypeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  threadTypeText: {
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
});
