import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Plus, X, UploadCloud } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const bookTypes = ['Textbook', 'Novel', 'Guide', 'Notes', 'Other'];

export default function EditListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  // form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCondition, setSelectedCondition] = useState(conditions[0]);
  const [selectedType, setSelectedType] = useState(bookTypes[0]);
  const [images, setImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // fetch existing listing
  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('book_listings').select('*').eq('id', id).single();
      if (error) {
        Alert.alert('Error', 'Unable to load listing');
        console.error(error);
        router.back();
        return;
      }
      setTitle(data.title);
      setAuthor(data.author);
      setIsbn(data.isbn || '');
      setPrice(String(data.price));
      setOriginalPrice(data.original_price ? String(data.original_price) : '');
      setDescription(data.description || '');
      setSelectedCondition(data.condition);
      setSelectedType(data.book_type);
      setExistingImages(data.images || []);
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please grant camera roll permissions to pick an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number, fromExisting = false) => {
    if (fromExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpdate = async () => {
    if (!title || !author || !price) {
      Alert.alert('Missing fields', 'Please fill required fields');
      return;
    }
    setUploadInProgress(true);
    try {
      const imageUrls: string[] = [...existingImages];
      // upload new images if any
      for (const img of images) {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2,9)}.jpg`;
        let file: Blob;
        const resp = await fetch(img);
        file = await resp.blob();
        const filePath = `${user!.id}/${filename}`;
        const { error: uploadError } = await supabase.storage.from('book-images').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(filePath);
        imageUrls.push(publicUrl);
      }

      const bookTypeMap: Record<string, string> = {
        'textbook': 'Textbook', 'novel': 'Novel', 'guide': 'Guide', 'notes': 'Notes', 'other': 'Other'
      };
      const updateData = {
        title,
        author,
        isbn: isbn || null,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        description,
        condition: selectedCondition,
        book_type: bookTypeMap[selectedType.toLowerCase()] || 'Other',
        images: imageUrls,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('book_listings').update(updateData).eq('id', id);
      if (error) throw error;
      Alert.alert('Success', 'Listing updated');
      router.push(`/marketplace/${id}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update listing');
    } finally {
      setUploadInProgress(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Listing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Book title" placeholderTextColor={colors.textSecondary} />

        {/* Author */}
        <Text style={styles.label}>Author</Text>
        <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="Author name" placeholderTextColor={colors.textSecondary} />

        {/* ISBN */}
        <Text style={styles.label}>ISBN</Text>
        <TextInput style={styles.input} value={isbn} onChangeText={setIsbn} placeholder="ISBN (optional)" placeholderTextColor={colors.textSecondary} />

        {/* Price */}
        <Text style={styles.label}>Price (₹)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Selling price" placeholderTextColor={colors.textSecondary} />

        {/* Original Price */}
        <Text style={styles.label}>Original Price (₹)</Text>
        <TextInput style={styles.input} value={originalPrice} onChangeText={setOriginalPrice} keyboardType="numeric" placeholder="Original price (optional)" placeholderTextColor={colors.textSecondary} />

        {/* Condition */}
        <Text style={styles.label}>Condition</Text>
        <View style={styles.row}>
          {conditions.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, selectedCondition === c && styles.chipSelected]} onPress={() => setSelectedCondition(c)}>
              <Text style={[styles.chipText, selectedCondition === c && styles.chipTextSelected]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type */}
        <Text style={styles.label}>Book Type</Text>
        <View style={styles.row}>
          {bookTypes.map(t => (
            <TouchableOpacity key={t} style={[styles.chip, selectedType === t && styles.chipSelected]} onPress={() => setSelectedType(t)}>
              <Text style={[styles.chipText, selectedType === t && styles.chipTextSelected]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline value={description} onChangeText={setDescription} placeholder="Describe the book" placeholderTextColor={colors.textSecondary} />

        {/* Images */}
        <Text style={styles.label}>Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {/* existing images */}
          {existingImages.map((uri, idx) => (
            <View key={`ex-${idx}`} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx, true)}>
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {/* new images */}
          {images.map((uri, idx) => (
            <View key={`new-${idx}`} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx)}>
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {/* add button */}
          <TouchableOpacity style={styles.addImage} onPress={pickImage}>
            <Plus size={24} color={colors.button} />
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.submitButton} onPress={handleUpdate} disabled={uploadInProgress}>
          {uploadInProgress ? <ActivityIndicator color="#fff" /> : <UploadCloud size={18} color="#fff" />}
          <Text style={styles.submitText}>{uploadInProgress ? 'Updating...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex:1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding:16, borderBottomWidth:1, borderBottomColor: colors.border },
  backButton: { padding:8, marginRight:8 },
  headerTitle: { fontSize:18, fontWeight:'600', color: colors.text },
  form: { padding:16 },
  label: { color: colors.textSecondary, marginTop:16, marginBottom:4, fontSize:14 },
  input: { backgroundColor: colors.surface, borderRadius:8, padding:12, color: colors.text },
  row: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { borderWidth:1, borderColor: colors.border, borderRadius:16, paddingHorizontal:12, paddingVertical:4, marginRight:8, marginBottom:8 },
  chipSelected: { backgroundColor: colors.button, borderColor: colors.button },
  chipText: { color: colors.text },
  chipTextSelected: { color:'#fff' },
  imageRow: { marginTop:8 },
  imageWrapper: { position:'relative', marginRight:12 },
  imageThumb: { width:80, height:80, borderRadius:8 },
  removeBtn: { position:'absolute', top:4, right:4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius:12, padding:2 },
  addImage: { width:80, height:80, borderRadius:8, borderWidth:2, borderColor: colors.button, justifyContent:'center', alignItems:'center' },
  submitButton: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor: colors.button, padding:16, borderRadius:12, marginTop:24, gap:8 },
  submitText: { color:'#fff', fontWeight:'600' }
});
