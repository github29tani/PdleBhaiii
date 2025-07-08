import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { AlertTriangle, X } from 'lucide-react-native';

type ReportType = 'note' | 'user' | 'comment';

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
}

export default function ReportModal({
  isVisible,
  onClose,
  type,
  targetId,
}: ReportModalProps) {
  const [reason, setReason] = useState('');

  const createReportMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reports').insert({
        type,
        reported_id: targetId,
        reason,
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep StudySphere safe. We will review your report.',
      );
      setReason('');
      onClose();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      console.error('Report submission error:', error);
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting');
      return;
    }
    createReportMutation.mutate();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.title}>Report {type}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Why are you reporting this {type}?</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Please provide details about why you're reporting this content..."
            value={reason}
            onChangeText={setReason}
            placeholderTextColor={colors.textTertiary}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={createReportMutation.isPending}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {createReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.warning,
  },
  submitButtonText: {
    color: colors.text,
  },
});
