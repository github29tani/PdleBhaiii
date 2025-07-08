// lib/supabase/storage.ts
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (
  file: File,
  groupId: string,
  onProgress?: (progress: number) => void
) => {
  console.log('Starting file upload...');
  console.log('File info:', {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  try {
    // Generate a unique filename with original extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `groups/${groupId}/resources/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('group-resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
        duplex: 'half',
        onProgress: (progress) => {
          const progressPercent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Upload progress: ${progressPercent}%`);
          if (onProgress) {
            onProgress(progressPercent);
          }
        },
      });

    if (error) {
      console.error('Upload error details:', {
        message: error.message,
        name: error.name,
        status: (error as any).status,
        statusCode: (error as any).statusCode,
      });
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from upload');
    }

    console.log('File uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('group-resources')
      .getPublicUrl(data.path);

    console.log('Generated public URL:', publicUrl);

    return {
      filePath: data.path,
      publicUrl,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size
    };
  } catch (error: any) {
    console.error('Error in uploadFile:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw new Error(`File upload failed: ${error.message || 'Unknown error'}`);
  }
};