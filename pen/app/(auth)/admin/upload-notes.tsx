import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Upload, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerResult } from 'expo-document-picker';

type Note = {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  board?: string;
  topic: string;
  file_type: 'pdf' | 'image' | 'doc';
  file_url: string;
  thumbnail_url?: string;
  uploader_id: string;
};

export default function UploadNotes() {
  const [note, setNote] = useState<Partial<Note>>({});
  const [file, setFile] = useState<DocumentPickerResult | null>(null);
  const queryClient = useQueryClient();

  const uploadNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<Note>) => {
      if (!file || !('uri' in file) || file.canceled) {
        throw new Error('No file selected');
      }

      // Upload file to storage
      const fileExt = file.assets[0].name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `notes/${fileName}`;

      // Convert file to Blob
      const response = await fetch(file.assets[0].uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('notes')
        .getPublicUrl(filePath);

      // Create note in database
      const { error: dbError } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          file_url: publicUrl,
          file_type: fileExt === 'pdf' ? 'pdf' : fileExt === 'doc' ? 'doc' : 'image',
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notes'] });
      setNote({});
      setFile(null);
    },
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (!result.canceled) {
        setFile(result);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload Notes</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={note.title}
          onChangeText={(text) => setNote(prev => ({ ...prev, title: text }))}
          placeholderTextColor={colors.textTertiary}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={note.description}
          onChangeText={(text) => setNote(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.textTertiary}
        />

        <TextInput
          style={styles.input}
          placeholder="Subject"
          value={note.subject}
          onChangeText={(text) => setNote(prev => ({ ...prev, subject: text }))}
          placeholderTextColor={colors.textTertiary}
        />

        <TextInput
          style={styles.input}
          placeholder="Class"
          value={note.class}
          onChangeText={(text) => setNote(prev => ({ ...prev, class: text }))}
          placeholderTextColor={colors.textTertiary}
        />

        <TextInput
          style={styles.input}
          placeholder="Board (optional)"
          value={note.board}
          onChangeText={(text) => setNote(prev => ({ ...prev, board: text }))}
          placeholderTextColor={colors.textTertiary}
        />

        <TextInput
          style={styles.input}
          placeholder="Topic"
          value={note.topic}
          onChangeText={(text) => setNote(prev => ({ ...prev, topic: text }))}
          placeholderTextColor={colors.textTertiary}
        />

        <TouchableOpacity 
          style={styles.fileButton} 
          onPress={pickDocument}
        >
          <Upload size={24} color={colors.primary} />
          <Text style={styles.fileButtonText}>
            {file && 'uri' in file && !file.canceled ? file.assets[0].name : 'Select File'}
          </Text>
          {file && 'uri' in file && (
            <TouchableOpacity 
              style={styles.clearFile}
              onPress={() => setFile(null)}
            >
              <X size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!note.title || !note.subject || !note.class || !note.topic || !file) && 
            styles.submitButtonDisabled
          ]}
          disabled={!note.title || !note.subject || !note.class || !note.topic || !file}
          onPress={() => uploadNoteMutation.mutate(note)}
        >
          {uploadNoteMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Note</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fileButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  clearFile: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
