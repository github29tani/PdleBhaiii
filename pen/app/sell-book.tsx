import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { ArrowLeft, Camera, Image as ImageIcon, X, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB'];
const UNIVERSITIES = ['IIT', 'NIT', 'DU', 'JNU', 'BHU', 'Other'];
const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const COURSES = ['B.Tech', 'BBA', 'MBA', 'B.Com', 'B.Sc', 'M.Sc', 'Other'];

export default function SellBookScreen() {
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [board, setBoard] = useState('');
  const [university, setUniversity] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Dropdown states
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const pickImage = async () => {
    // Request permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to upload book images.');
      return;
    }

    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Add the selected image to the images array
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = () => {
    // Basic form validation
    if (!title || !author || !price || !condition || !location || !contactNumber || images.length === 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields and add at least one image.');
      return;
    }

    // Here you would typically send the data to your backend
    console.log({
      title,
      author,
      price,
      description,
      condition,
      board,
      university,
      class: classLevel,
      course,
      subject,
      location,
      contactNumber,
      images,
    });

    // Show success message and navigate back
    Alert.alert('Success', 'Your book has been listed successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Your Book</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Photos *</Text>
          <Text style={styles.sectionSubtitle}>Add up to 5 photos. The first one will be the main photo.</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePickerContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.uploadedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 5 && (
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Camera size={24} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Book Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter book title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Author *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter author name"
              value={author}
              onChangeText={setAuthor}
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Condition *</Text>
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => setShowConditionDropdown(!showConditionDropdown)}
            >
              <Text style={[styles.dropdownText, !condition && { color: '#666' }]}>
                {condition || 'Select condition'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            
            {showConditionDropdown && (
              <View style={styles.dropdown}>
                {CONDITIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCondition(item);
                      setShowConditionDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your book's condition, any highlights, notes, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Academic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Board</Text>
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => setShowBoardDropdown(!showBoardDropdown)}
            >
              <Text style={[styles.dropdownText, !board && { color: '#666' }]}>
                {board || 'Select board'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            
            {showBoardDropdown && (
              <View style={styles.dropdown}>
                {BOARDS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setBoard(item);
                      setShowBoardDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>University</Text>
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => setShowUniversityDropdown(!showUniversityDropdown)}
            >
              <Text style={[styles.dropdownText, !university && { color: '#666' }]}>
                {university || 'Select university'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            
            {showUniversityDropdown && (
              <View style={styles.dropdown}>
                {UNIVERSITIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setUniversity(item);
                      setShowUniversityDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Class</Text>
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => setShowClassDropdown(!showClassDropdown)}
            >
              <Text style={[styles.dropdownText, !classLevel && { color: '#666' }]}>
                {classLevel || 'Select class'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            
            {showClassDropdown && (
              <View style={styles.dropdown}>
                {CLASSES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setClassLevel(item);
                      setShowClassDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Course</Text>
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => setShowCourseDropdown(!showCourseDropdown)}
            >
              <Text style={[styles.dropdownText, !course && { color: '#666' }]}>
                {course || 'Select course'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            
            {showCourseDropdown && (
              <View style={styles.dropdown}>
                {COURSES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCourse(item);
                      setShowCourseDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mathematics, Physics"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Pricing & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Location</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., IIT Delhi, South Campus"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contact Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your WhatsApp/mobile number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#666"
            />
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Publish Listing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  imagePickerContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  uploadButton: {
    width: 100,
    height: 120,
    borderWidth: 1,
    borderColor: '#2D2D3A',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadButtonText: {
    color: colors.primary,
    marginTop: 8,
    fontSize: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  uploadedImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1E1E2D',
    borderRadius: 8,
    padding: 14,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E2D',
    borderRadius: 8,
    padding: 14,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2D2D3A',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 100,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A4A',
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
