import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';
import { useNotesStore } from '@/store/notes-store';
import { supabase } from '@/lib/supabase';
import { mockCategories } from '@/mocks/categories';
import { mockClasses } from '@/mocks/classes';

interface NoteData {
  id?: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  topic: string;
  language: string;
  file_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
  uploader_id?: string;
  uploader_name?: string;
  uploader_avatar?: string;
  downloads?: number;
  comments?: number;
  status?: string;
  created_at?: string;
}

const languages = [
  { id: 'english', name: 'English' },
  { id: 'hindi', name: 'Hindi' },
  { id: 'gujarati', name: 'Gujarati' },
  { id: 'marathi', name: 'Marathi' },
  { id: 'bengali', name: 'Bengali' },
  { id: 'tamil', name: 'Tamil' },
  { id: 'telugu', name: 'Telugu' },
  { id: 'kannada', name: 'Kannada' },
  { id: 'malayalam', name: 'Malayalam' },
  { id: 'punjabi', name: 'Punjabi' },
  { id: 'urdu', name: 'Urdu' }
];

export default function UploadScreen() {
  const router = useRouter();
  const { id: noteId } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthStore();
  const { uploadNote, updateNote, isLoading } = useNotesStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [other_subject, setOtherSubject] = useState('');
  const [class_level, setClassLevel] = useState('');
  const [other_class, setOtherClass] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('');
  const [other_language, setOtherLanguage] = useState('');
  const [thumbnail_uri, setThumbnailUri] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ uri: string; name: string; mimeType: string; file?: File } | null>(null);
  const [selected_file, setSelectedFile] = useState<{ uri: string; name: string; mimeType: string; file?: File } | null>(null);
  const [upload_in_progress, setUploadInProgress] = useState(false);
  const [upload_button_text, setUploadButtonText] = useState('Select PDF file');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubject('');
    setOtherSubject('');
    setClassLevel('');
    setOtherClass('');
    setTopic('');
    setLanguage('');
    setOtherLanguage('');
    setThumbnailUri(null);
    setSelectedFile(null);
    setUploadInProgress(false);
    setUploadButtonText('Select PDF file');
    setErrors({});
  };

  // Clear form when component unmounts
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, []);

  // Clear errors when input changes
  const handleInputChange = (field: string, value: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'subject':
        setSubject(value);
        break;
      case 'class_level':
        setClassLevel(value);
        break;
      case 'topic':
        setTopic(value);
        break;
      case 'language':
        setLanguage(value);
        break;
    }

    validateField(field, value);
  };

  const handleRemovePreview = () => {
    setPreviewImage(null);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleFileSelect = async (isPreview = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: isPreview ? ['image/*'] : ['application/pdf'],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Convert to File object for Supabase
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';
        const file = new File([blob], asset.name, { type: mimeType });

        if (isPreview) {
          setPreviewImage({
            uri: asset.uri,
            name: asset.name,
            mimeType,
            file,
          });
        } else {
          setSelectedFile({
            uri: asset.uri,
            name: asset.name,
            mimeType,
            file,
          });
          setUploadButtonText(asset.name);
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'title':
        if (!value.trim()) {
          setErrors(prev => ({ ...prev, [field]: 'Title is required' }));
        }
        break;
      case 'subject':
        if (!value.trim() && !other_subject.trim()) {
          setErrors(prev => ({ ...prev, [field]: 'Subject is required' }));
        }
        break;
      case 'class_level':
        if (!value.trim() && !other_class.trim()) {
          setErrors(prev => ({ ...prev, [field]: 'Class is required' }));
        }
        break;
      case 'language':
        if (!value.trim()) {
          setErrors(prev => ({ ...prev, [field]: 'Language is required' }));
        }
        break;
      default:
        break;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!subject.trim() && !other_subject.trim()) newErrors.subject = 'Subject is required';
    if (!class_level.trim() && !other_class.trim()) newErrors.class = 'Class is required';
    if (!thumbnail_uri) newErrors.thumbnail = 'Thumbnail image is required';
    if (!selected_file) newErrors.file = 'Please select a PDF file to upload';
    if (!language) newErrors.language = 'Please select a language';
    if (language === 'other' && !other_language.trim()) {
      newErrors.other_language = 'Please enter a language';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFileToSupabase = async (uri: string, path: string, file?: File) => {
    try {
      console.log('Starting file upload to Supabase...');
      console.log('Path:', path);

      let data;
      let error;

      if (Platform.OS === 'web' && file) {
        // Web upload
        ({ data, error } = await supabase.storage
          .from('notes')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: true
          }));
      } else {
        // Native upload
        if (Platform.OS === 'android') {
          const response = await fetch(`file://${uri}`);
          const blob = await response.blob();
          ({ data, error } = await supabase.storage
            .from('notes')
            .upload(path, blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'application/pdf'
            }));
        } else {
          const response = await fetch(uri);
          const blob = await response.blob();
          ({ data, error } = await supabase.storage
            .from('notes')
            .upload(path, blob, {
              cacheControl: '3600',
              upsert: true
            }));
        }
      }

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = await supabase.storage
        .from('notes')
        .getPublicUrl(path);

      console.log('Generated public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      if (error instanceof Error) {
        Alert.alert('Upload Error', error.message);
      } else {
        Alert.alert('Upload Error', 'Failed to upload file');
      }
      throw error;
    }
  };

  const handleLanguageSelect = (lang: string) => {
    if (lang === 'other') {
      setLanguage('other');
      setOtherLanguage('');
    } else {
      setLanguage(lang);
      setOtherLanguage('');
    }
  };

  const handleOtherLanguageChange = (text: string) => {
    setOtherLanguage(text);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) return;

    // Ensure user is authenticated
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to upload notes');
      router.replace('/(auth)/login');
      return;
    }

    // In edit mode, ensure the user is the owner
    if (isEditMode && noteId) {
      const { data: note, error } = await supabase
        .from('notes')
        .select('uploader_id')
        .eq('id', noteId)
        .single();
        
      if (error || note?.uploader_id !== user.id) {
        Alert.alert('Error', 'You do not have permission to edit this note');
        return;
      }
    }

    setUploadInProgress(true);
    
    try {
      // First upload the file to storage
      const uploadNote = async () => {
        if (!selected_file) {
          Alert.alert('Error', 'Please select a file to upload');
          return;
        }

        try {
          setUploadInProgress(true);

          // Get current session to ensure we have a valid token
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new Error('Authentication session expired. Please sign in again.');
          }

          // Upload main file to Supabase Storage if it's a new file or if we're not in edit mode
          let fileUrl = selected_file?.uri;
          if (selected_file && (!isEditMode || !selected_file.uri.startsWith('http'))) {
            const fileExt = selected_file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `notes/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('notes')
              .upload(filePath, selected_file.file!);

            if (uploadError) throw uploadError;

            // Get public URL for main file
            const { data: { publicUrl } } = supabase.storage
              .from('notes')
              .getPublicUrl(filePath);
              
            fileUrl = publicUrl;
          }

          // Upload preview image if provided and it's a new image
          let previewUrl = previewImage?.uri || '';
          if (previewImage && !previewImage.uri.startsWith('http')) {
            const previewExt = previewImage.name.split('.').pop();
            const previewFileName = `preview-${user.id}-${Date.now()}.${previewExt}`;
            const previewPath = `previews/${previewFileName}`;

            // Upload to the 'previews' bucket
            const { error: previewUploadError } = await supabase.storage
              .from('previews')
              .upload(previewPath, previewImage.file!);

            if (previewUploadError) throw previewUploadError;

            // Get public URL for the preview image
            const { data: { publicUrl: previewPublicUrl } } = supabase.storage
              .from('previews')
              .getPublicUrl(previewPath);
              
            previewUrl = previewPublicUrl;
          }

          // Prepare note data
          const noteData = {
            title,
            description,
            subject: subject === 'other' ? other_subject : subject,
            class: class_level === 'other' ? other_class : class_level,
            topic,
            language: language === 'other' ? other_language : language,
            file_type: 'pdf',
            file_url: fileUrl,
            preview_url: previewUrl || null,
            thumbnail_url: thumbnail_uri,
            status: 'pending',
            updated_at: new Date().toISOString()
          };

          console.log(isEditMode ? 'Updating note with data:' : 'Creating note with data:', noteData);

          let note;
          let dbError;

          if (isEditMode && noteId) {
            // Update existing note
            const { data, error } = await supabase
              .from('notes')
              .update(noteData)
              .eq('id', noteId)
              .select()
              .single();
            note = data;
            dbError = error;
          } else {
            // Create new note
            const { data, error } = await supabase
              .from('notes')
              .insert({
                ...noteData,
                uploader_id: user.id,
                uploader_name: user.name || 'Anonymous',
                uploader_avatar: user.avatar_url || null,
                downloads: 0,
                comments: 0,
                created_at: new Date().toISOString()
              })
              .select()
              .single();
            note = data;
            dbError = error;
          }

          if (dbError) {
            console.error('Database error details:', dbError);
            throw dbError;
          }

          // Reset form and show success message
          if (!isEditMode) {
            resetForm();
          }
          
          Alert.alert(
            'Success',
            isEditMode 
              ? 'Your note has been updated successfully!'
              : 'Your note has been uploaded successfully! It will be reviewed by our team before being published.',
            [
              {
                text: 'OK',
                onPress: () => {
                  if (isEditMode && noteId) {
                    // Navigate back to the note detail page after successful update
                    router.replace(`/note/${noteId}`);
                  } else {
                    // For new notes, go to the home screen
                    router.replace('/(tabs)');
                  }
                },
              },
            ]
          );
          
          // If user doesn't click OK, still navigate after a short delay
          setTimeout(() => {
            if (isEditMode && noteId) {
              router.replace(`/note/${noteId}`);
            } else {
              router.replace('/(tabs)');
            }
          }, 1500);
        } catch (error) {
          console.error('Upload error details:', error);
          Alert.alert(
            'Upload Failed',
            error instanceof Error ? error.message : 'Failed to upload note. Please try again.'
          );
        } finally {
          setUploadInProgress(false);
        }
      };

      await uploadNote();
    } catch (error) {
      console.error('Error in upload process:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setUploadInProgress(false);
    }
  };

  // Load note data if in edit mode
  useEffect(() => {
    const loadNoteData = async () => {
      if (!noteId) return;
      
      try {
        const { data: note, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();
          
        if (error) throw error;
        
        if (note) {
          setIsEditMode(true);
          setTitle(note.title);
          setDescription(note.description || '');
          setSubject(note.subject);
          setClassLevel(note.class);
          setTopic(note.topic || '');
          setLanguage(note.language);
          
          if (note.thumbnail_url) {
            setThumbnailUri(note.thumbnail_url);
          }
          
          if (note.file_url) {
            setSelectedFile({
              uri: note.file_url,
              name: note.file_url.split('/').pop() || 'document.pdf',
              mimeType: 'application/pdf'
            });
            setUploadButtonText(note.file_url.split('/').pop() || 'document.pdf');
          }
          
          if (note.preview_url) {
            setPreviewImage({
              uri: note.preview_url,
              name: note.preview_url.split('/').pop() || 'preview.jpg',
              mimeType: 'image/jpeg'
            });
          }
        }
      } catch (error) {
        console.error('Error loading note:', error);
        Alert.alert('Error', 'Failed to load note data');
      }
    };
    
    loadNoteData();
  }, [noteId]);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isEditMode ? 'Edit Note' : 'Upload Note'}</Text>
          <Text style={styles.subtitle}>
            {isEditMode ? 'Update your note details' : 'Share your knowledge with others'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <Input
            placeholder="Enter a descriptive title"
            value={title}
            onChangeText={(value) => handleInputChange('title', value)}
            error={errors.title}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <Input
            placeholder="Describe what your notes cover"
            value={description}
            onChangeText={(value) => handleInputChange('description', value)}
            error={errors.description}
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.section}>
            <Text style={styles.label}>Subject</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.optionsContainer}
            >
              {mockCategories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.option,
                    subject === item.id && styles.selectedOption
                  ]}
                  onPress={() => handleInputChange('subject', item.id)}
                >
                  <Text style={[
                    styles.optionText,
                    subject === item.id && styles.selectedOptionText
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {subject === 'other' && (
              <View style={styles.otherInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your subject"
                  placeholderTextColor={colors.textSecondary}
                  value={other_subject}
                  onChangeText={setOtherSubject}
                />
              </View>
            )}
            {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.label}>Language</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.optionsContainer}
            >
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.option,
                    language === lang.id && styles.selectedOption
                  ]}
                  onPress={() => handleLanguageSelect(lang.id)}
                >
                  <Text style={[
                    styles.optionText,
                    language === lang.id && styles.selectedOptionText
                  ]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.option,
                  language === 'other' && styles.selectedOption
                ]}
                onPress={() => handleLanguageSelect('other')}
              >
                <Text style={[
                  styles.optionText,
                  language === 'other' && styles.selectedOptionText
                ]}>
                  Other
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {language === 'other' && (
              <Input
                label="Enter Language"
                value={other_language}
                onChangeText={handleOtherLanguageChange}
                placeholder="Type your language"
                error={errors.other_language}
              />
            )}
            {errors.language && <Text style={styles.errorText}>{errors.language}</Text>}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.label}>Class/Exam</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.optionsContainer}
            >
              {mockClasses.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.option,
                    class_level === item.id && styles.selectedOption
                  ]}
                  onPress={() => handleInputChange('class_level', item.id)}
                >
                  <Text style={[
                    styles.optionText,
                    class_level === item.id && styles.selectedOptionText
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {class_level === 'other' && (
              <View style={styles.otherInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your class/exam"
                  placeholderTextColor={colors.textSecondary}
                  value={other_class}
                  onChangeText={setOtherClass}
                />
              </View>
            )}
            {errors.class_level && (
              <Text style={styles.errorText}>{errors.class_level}</Text>
            )}
          </View>
          
          <Text style={styles.label}>Topics Covered (Optional)</Text>
          <Input
            placeholder="E.g., Mechanics, Thermodynamics"
            value={topic}
            onChangeText={(value) => handleInputChange('topic', value)}
            error={errors.topic}
          />
          
          <View style={styles.fileSection}>
            <Text style={styles.label}>Upload PDF</Text>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={() => handleFileSelect(false)}
            >
              <FileText size={24} color={colors.text} />
              <Text style={styles.fileButtonText}>{upload_button_text}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fileButton}
              onPress={() => handleFileSelect(true)}
            >
              <ImageIcon size={24} color={colors.text} />
              <Text style={styles.fileButtonText}>
                {previewImage ? previewImage.name : 'Select Preview Image'}
              </Text>
            </TouchableOpacity>
            {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
            
            {selected_file && (
              <View style={styles.selectedFile}>
                <View style={styles.selectedFileHeader}>
                  <Text style={styles.selectedFileName}>{selected_file.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <X size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.thumbnailSection}>
            <Text style={styles.label}>Thumbnail Image</Text>
            {thumbnail_uri ? (
              <Image source={{ uri: thumbnail_uri }} style={styles.thumbnailPreview} />
            ) : (
              <TouchableOpacity 
                style={styles.thumbnailPreview}
                onPress={() => pickImage()}
              >
                <Upload size={32} color={colors.textSecondary} />
                <Text style={[styles.fileButtonText, { marginTop: 12 }]}>Upload Thumbnail</Text>
              </TouchableOpacity>
            )}
            {errors.thumbnail && <Text style={styles.errorText}>{errors.thumbnail}</Text>}
          </View>
          
          <Button
            title={isLoading ? (isEditMode ? 'Updating...' : 'Uploading...') : (isEditMode ? 'Update Note' : 'Upload Note')}
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitButton}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6C5CE7',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  option: {
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.4)',
  },
  selectedOption: {
    backgroundColor: '#6C5CE7',
  },
  optionText: {
    fontSize: 16,
    color: '#E2E2FF',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  fileSection: {
    marginTop: 24,
  },
  fileButton: {
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(108, 92, 231, 0.4)',
    borderStyle: 'dashed',
  },
  fileButtonText: {
    color: '#E2E2FF',
    fontSize: 16,
    marginTop: 8,
  },
  selectedFile: {
    marginTop: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.4)',
  },
  selectedFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedFileName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 14,
  },
  thumbnailSection: {
    marginTop: 24,
  },
  thumbnailPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  otherInputContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    minWidth: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownContainer: {
    flex: 1,
  },
  optionsScroll: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
});