// components/resources/ResourceUploadModal.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { uploadFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

type DocumentPickerAsset = {
  uri: string;
  name?: string;
  mimeType?: string;
  size?: number;
  file?: File;
};

type DocumentPickerResult = {
  canceled: boolean;
  assets: DocumentPickerAsset[];
  output?: FileList;
};

import { colors } from '@/constants/colors';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface ResourceUploadModalProps {
  groupId: string;
  isVisible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({
  groupId,
  isVisible,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickDocument = async () => {
    try {
      console.log('Starting document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', result);

      // Handle web response format
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('File selected (web format):', asset);

        if (asset.uri) {
          // For web, we can use the file directly from the input
          if (asset.uri.startsWith('file:')) {
            // On mobile/Expo
            const fileInfo = await FileSystem.getInfoAsync(asset.uri);
            console.log('File info:', fileInfo);
            
            // Create a blob from the file
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            
            // Create a File object
            const fileObj = new File(
              [blob], 
              asset.name || 'file', 
              { 
                type: asset.mimeType || 'application/octet-stream',
                lastModified: Date.now()
              }
            );
            
            setFile(fileObj);
          } else {
            // On web, use the file from the output FileList
            if (result.output && result.output.length > 0) {
              setFile(result.output[0]);
            } else {
              throw new Error('No file data available');
            }
          }
          
          // Set the title from the filename (without extension)
          const fileName = asset.name || 'document';
          const titleWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          setTitle(titleWithoutExt);
        }
      } else if (result.canceled) {
        console.log('User cancelled file picker');
      }
    } catch (err: any) {
      console.error('Error picking document:', {
        error: err,
        message: err?.message,
        stack: err?.stack
      });
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please provide a title');
      return;
    }

    console.log('Starting upload...');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log('Uploading file to storage...');
      const uploadResult = await uploadFile(
        file,
        groupId,
        (progress: number) => {
          console.log(`Upload progress: ${progress}%`);
          setUploadProgress(progress);
        }
      );
      
      console.log('File uploaded successfully:', uploadResult);

      console.log('Creating resource record in database...');
      const { data, error } = await supabase
        .from('resources')
        .insert({
          group_id: groupId,
          title: title.trim(),
          description: description.trim(),
          file_url: uploadResult.publicUrl,
          file_name: uploadResult.fileName,
          file_type: uploadResult.fileType,
          file_size: uploadResult.fileSize,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Resource created:', data);
      Alert.alert('Success', 'Resource uploaded successfully');
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error in handleUpload:', error);
      const errorMessage = error?.message || 'Failed to upload resource. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <View style={[styles.container, styles.modal]}>
        <Text style={styles.modalTitle}>Upload Resource</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickDocument}
          disabled={isUploading}
        >
          <Text style={styles.uploadButtonText}>
            {file ? file.name : 'Choose File'}
          </Text>
        </TouchableOpacity>

        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter resource title"
          style={styles.input}
          onBlur={!isUploading ? undefined : () => {}}
        />

        <Input
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter a brief description"
          multiline
          numberOfLines={3}
          style={{
            ...styles.input,
            ...styles.descriptionInput,
          }}
          onBlur={!isUploading ? undefined : () => {}}
        />

        {uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(uploadProgress)}% uploaded
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            variant="outline"
            onPress={onClose}
            disabled={isUploading}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onPress={handleUpload}
            disabled={!file || !title.trim() || isUploading}
            isLoading={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: colors.text,
  },
  container: {
    padding: 16,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 'auto',
  },
});