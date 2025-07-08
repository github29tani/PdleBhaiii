import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Upload, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { uploadAdImage, deleteAdImage } from '@/utils/adStorage';

interface AdImageUploaderProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
}

export const AdImageUploader: React.FC<AdImageUploaderProps> = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      
      // For web
      if (typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          const fileName = `${Date.now()}-${file.name}`;
          const url = await uploadAdImage(file, fileName);
          
          if (url) {
            onImageUploaded(url);
          }
        };
        
        input.click();
      }
      // For native, you would use react-native-image-picker or expo-image-picker
      
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentImageUrl) return;
    
    try {
      setIsUploading(true);
      const fileName = currentImageUrl.split('/').pop();
      if (!fileName) return;
      
      const success = await deleteAdImage(fileName);
      if (success) {
        onImageRemoved();
      }
    } catch (error) {
      console.error('Error removing image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {currentImageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentImageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemove}
            disabled={isUploading}
          >
            <X size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Upload size={24} color={colors.primary} />
              <Text style={styles.uploadText}>Upload Image</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 8,
  },
  uploadText: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
