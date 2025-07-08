import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TouchableOpacity } from 'react-native';
import { HelpCircle, FileCode2, BrainCircuit, BookOpenCheck, X } from 'lucide-react-native';

type ThreadType = 'DOUBT' | 'FORMULA' | 'CONCEPT' | 'PYQ';

interface CreateThreadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string, type: ThreadType) => Promise<void>;
  groupId: string;
}

const threadTypes = [
  { 
    type: 'DOUBT' as const, 
    label: 'Doubt Corner',
    icon: <HelpCircle size={20} color={colors.primary} />,
    description: 'Ask questions and get help from the community'
  },
  { 
    type: 'FORMULA' as const, 
    label: 'Formula Sharing',
    icon: <FileCode2 size={20} color={colors.secondary} />,
    description: 'Share and discuss important formulas'
  },
  { 
    type: 'CONCEPT' as const, 
    label: 'Concept Discussion',
    icon: <BrainCircuit size={20} color={colors.success} />,
    description: 'Deep dive into complex topics'
  },
  { 
    type: 'PYQ' as const, 
    label: 'Past Year Questions',
    icon: <BookOpenCheck size={20} color={colors.warning} />,
    description: 'Discuss previous exam questions and solutions'
  },
];

export const CreateThreadModal = ({ visible, onClose, onSubmit, groupId }: CreateThreadModalProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<ThreadType>('DOUBT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(title, content, selectedType);
      setTitle('');
      setContent('');
      setSelectedType('DOUBT');
      onClose();
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Discussion</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <Text style={styles.label}>Thread Type</Text>
            <View style={styles.threadTypeContainer}>
              {threadTypes.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  style={[
                    styles.threadTypeButton,
                    selectedType === type.type && styles.threadTypeButtonActive
                  ]}
                  onPress={() => setSelectedType(type.type)}
                >
                  <View style={styles.threadTypeIcon}>
                    {type.icon}
                  </View>
                  <Text style={styles.threadTypeLabel}>{type.label}</Text>
                  <Text style={styles.threadTypeDescription}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title for your thread"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.contentInput]}
              value={content}
              onChangeText={setContent}
              placeholder="Write your question or discussion topic here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button 
              variant="outline" 
              onPress={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!title.trim() || !content.trim() || isSubmitting}
            >
              Create Thread
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
};

export default CreateThreadModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 0,
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
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  threadTypeContainer: {
    marginBottom: 16,
  },
  threadTypeButton: {
    backgroundColor: colors.background + '80',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  threadTypeButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  threadTypeIcon: {
    marginBottom: 8,
  },
  threadTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  threadTypeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  cancelButton: {
    marginRight: 8,
  },
});
