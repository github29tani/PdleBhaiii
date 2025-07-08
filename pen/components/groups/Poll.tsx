import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '@/constants/colors';
import { Poll as PollIcon, CheckCircle, Circle } from 'lucide-react-native';

// Poll type
type Poll = {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  created_at: string;
  total_votes: number;
  user_vote?: string; // ID of the option user voted for
};

export function Poll({ groupId }: { groupId: string }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(null);

  // TODO: Implement actual data fetching from Supabase
  const polls: Poll[] = [
    {
      id: '1',
      question: 'What’s the molar mass of NaCl?',
      options: [
        { id: 'a', text: '56g/mol', votes: 12 },
        { id: 'b', text: '58.5g/mol', votes: 87 },
        { id: 'c', text: '60g/mol', votes: 5 },
      ],
      created_at: new Date().toISOString(),
      total_votes: 104,
      user_vote: 'b',
    },
  ];

  const handleVote = (optionId: string) => {
    // TODO: Implement voting logic
    setPoll(null); // Close poll after voting
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Quiz</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <PollIcon size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {polls.map((poll) => (
        <Card key={poll.id} style={styles.pollCard}>
          <Text style={styles.question}>{poll.question}</Text>
          
          {poll.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                poll.user_vote === option.id && styles.selectedOption,
              ]}
              onPress={() => handleVote(option.id)}
              disabled={!!poll.user_vote}
            >
              <View style={styles.optionIcon}>
                {poll.user_vote === option.id ? (
                  <CheckCircle size={16} color={colors.success} />
                ) : (
                  <Circle size={16} color={colors.text} />
                )}
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
              <Text style={styles.voteCount}>
                {option.votes} votes
              </Text>
            </TouchableOpacity>
          ))}
          
          <Text style={styles.totalVotes}>
            Total votes: {poll.total_votes}
          </Text>
        </Card>
      ))}

      {/* Create Poll Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Card style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Poll</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* TODO: Add poll creation form */}
          <Text style={styles.modalText}>
            Add poll creation form here
          </Text>
        </Card>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  pollCard: {
    marginBottom: 12,
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    flex: 1,
    color: colors.text,
  },
  voteCount: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  totalVotes: {
    marginTop: 8,
    color: colors.textSecondary,
    textAlign: 'right',
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
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalText: {
    color: colors.text,
  },
});
