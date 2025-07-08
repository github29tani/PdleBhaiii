// pen/components/groups/ThreadForm.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { X, Paperclip, Image as ImageIcon } from 'lucide-react-native';

type ThreadFormProps = {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  initialData?: {
    id?: string;
    title: string;
    content: string;
    type: 'doubt' | 'formula' | 'concept' | 'past-year';
  };
  onSuccess?: () => void;
};

export function ThreadForm({ visible, onClose, groupId, initialData, onSuccess }: ThreadFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [type, setType] = useState<'doubt' | 'formula' | 'concept' | 'past-year'>(
    initialData?.type || 'doubt'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setType(initialData.type);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('doubt');
    setError('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const threadData = {
        title: title.trim(),
        content: content.trim(),
        type,
        group_id: groupId,
      };

      if (initialData?.id) {
        // Update existing thread
        const { error } = await supabase
          .from('threads')
          .update(threadData)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Create new thread
        const { error } = await supabase
          .from('threads')
          .insert([{ ...threadData, created_by: (await supabase.auth.getUser()).data.user?.id }]);

        if (error) throw error;
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving thread:', err);
      setError('Failed to save thread. Please try again.');
    }