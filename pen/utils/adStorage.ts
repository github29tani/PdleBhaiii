import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

const isProduction = Constants.expoConfig?.extra?.isProduction || false;

export const uploadAdImage = async (
  file: File,
  fileName: string
): Promise<string | null> => {
  try {
    if (isProduction) {
      const filePath = `images/${fileName}`;
      const { error: uploadError, data } = await supabase.storage
        .from('ads')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath);

      return publicUrl;
    } else {
      // For local development, create a blob URL
      return URL.createObjectURL(file);
    }

    return null;
  } catch (error) {
    console.error('Error uploading ad image:', error);
    return null;
  }
};

export const deleteAdImage = async (url: string): Promise<boolean> => {
  try {
    if (isProduction) {
      const fileName = url.split('/').pop();
      if (!fileName) return false;

      const filePath = `images/${fileName}`;
      const { error } = await supabase.storage
        .from('ads')
        .remove([filePath]);

      if (error) throw error;
    } else {
      // For local development, revoke the blob URL
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (error) {
    console.error('Error deleting ad image:', error);
    return false;
  }
};

export const getAdImageUrl = (url: string): string => {
  if (isProduction) {
    const fileName = url.split('/').pop();
    if (!fileName) return url;

    const { data: { publicUrl } } = supabase.storage
      .from('ads')
      .getPublicUrl(`images/${fileName}`);
    return publicUrl;
  }
  return url;
};
