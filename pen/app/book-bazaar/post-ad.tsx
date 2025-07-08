import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { ArrowLeft, Image as ImageIcon, X, ChevronDown, Check, AlertCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { fetchBookListingById } from '@/lib/supabase/book-bazaar';

// Logging utility
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[PostAd][${timestamp}] ${message}`, data);
  } else {
    console.log(`[PostAd][${timestamp}] ${message}`);
  }
};

// Error logging utility
const logError = (message: string, error: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[PostAd][${timestamp}][ERROR] ${message}`, error);
};

type BookCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
type ContactPreference = 'in_app' | 'whatsapp' | 'phone';

export default function PostAdScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [bookData, setBookData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [edition, setEdition] = useState('');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [board, setBoard] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isForExchange, setIsForExchange] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<BookCondition>('Good');
  const [contactPreference, setContactPreference] = useState<ContactPreference>('whatsapp' as ContactPreference);
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<{
    id: string;
    startTime: number;
  } | null>(null);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);

  const conditions: BookCondition[] = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
  const boards = ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB', 'Other'];

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      loadBookData();
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [id]);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setSubject('');
    setClassName('');
    setBoard('');
    setPrice('');
    setIsFree(false);
    setIsForExchange(false);
    setLocation('');
    setDescription('');
    setCondition('Good');
    setContactPreference('whatsapp');
    setPhone('');
    setImages([]);
  };

  const loadBookData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      log('Loading book data for edit', { id });
      const data = await fetchBookListingById(id);
      if (data) {
        setBookData(data);
        // Pre-fill form fields
        setTitle(data.book.title);
        setAuthor(data.book.author);
        setSubject(data.book.subject);
        setClassName(data.book.class_level || '');
        setBoard(data.book.board_university || '');
        setPrice(data.price_inr.toString());
        setIsFree(data.is_free);
        setIsForExchange(data.is_for_exchange);
        setLocation(data.location);
        setCondition(data.book.condition);
        // Ensure contact preference is valid before setting
        const validContactPreference = data.contact_preference as ContactPreference;
        setContactPreference(validContactPreference || 'whatsapp');
        setPhone(data.contact_phone || '');
        setDescription(data.book.description);
        setImages(data.images.map(img => img.url));
        setIsDataLoaded(true);
      } else {
        setError('Book not found');
      }
    } catch (error) {
      logError('Error loading book data', error);
      setError('Failed to load book data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    log('Image picker triggered');
    
    if (images.length >= 5) {
      log('Maximum image limit reached', { currentCount: images.length });
      Alert.alert('Maximum 5 images allowed');
      return;
    }

    log('Requesting media library permissions');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      log('Media library permission denied');
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    log('Launching image picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const startTime = Date.now();
    log('Removing image', { index, totalImages: images.length });
    const newImages = [...images];
    const removedImage = newImages.splice(index, 1)[0];
    setImages(newImages);
    log('Image removed', { 
      index, 
      removedImage, 
      remainingImages: newImages.length,
      duration: Date.now() - startTime 
    });
  };

  // Function to upload image to Supabase Storage
  const uploadImageToStorage = async (uri: string, listingId: string, index: number): Promise<string> => {
    try {
      log(`Starting image upload ${index + 1} of ${images.length}`, { uri });
      
      // Extract file extension from URI or default to jpg
      let fileExt = 'jpg';
      const match = uri.match(/\.(\w+)$/);
      if (match && match[1]) {
        fileExt = match[1].toLowerCase();
      }
      
      // Generate a unique filename
      const fileName = `${listingId}/${Date.now()}-${index}.${fileExt}`;
      
      // For React Native, we'll use the fetch API to get the file
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload blob directly to Supabase Storage
      const { data, error } = await supabase.storage
        .from('book_images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || `image/${fileExt}`,
        });
      
      if (error) {
        logError(`Error uploading image ${index + 1}`, { error });
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('book_images')
        .getPublicUrl(fileName);
      
      log(`Successfully uploaded image ${index + 1}`, { publicUrl });
      return publicUrl;
      
    } catch (error: any) {
      logError(`Failed to upload image ${index + 1}`, { error });
      throw new Error(`Image upload failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async () => {
    const submissionId = `sub_${Date.now()}`;
    const startTime = Date.now();
    
    // Update submission state
    setSubmissionState({ id: submissionId, startTime });
    
    if (isSubmitting) {
      log('Form submission prevented - already submitting', { submissionId });
      return;
    }
    
    log('Form submission started', { submissionId, timestamp: new Date().toISOString() });
    setIsSubmitting(true);
    
    // Log current form state (sensitive data redacted)
    const formData = {
      titleLength: title.length,
      authorLength: author.length,
      editionLength: edition.length,
      subjectLength: subject?.length || 0,
      classNameLength: className.length,
      boardLength: board.length,
      price: isFree ? 'free' : isForExchange ? 'exchange' : price,
      isFree,
      isForExchange,
      locationLength: location.length,
      descriptionLength: description.length,
      condition,
      contactPreference,
      phoneLength: phone.length,
      imagesCount: images.length,
    };
    
    log('Form data being processed', { submissionId, formData });

    // Enhanced form validation
    const validationErrors = [
      !title && { field: 'title', message: 'Title is required' },
      !author && { field: 'author', message: 'Author is required' },
      (!isFree && !isForExchange && !price) && { field: 'price', message: 'Price is required or mark as free/exchange' },
      !location && { field: 'location', message: 'Location is required' },
      images.length === 0 && { field: 'images', message: 'At least one image is required' },
      phone && !/^\+?[\d\s-]{10,}$/.test(phone) && { 
        field: 'phone', 
        message: 'Please enter a valid phone number' 
      }
    ].filter(Boolean) as Array<{field: string; message: string}>;

    if (validationErrors.length > 0) {
      const errorDetails = {
        submissionId,
        errors: validationErrors,
        validationTime: Date.now() - startTime,
        formData
      };
      
      logError('Form validation failed', errorDetails);
      
      // Show first error to user
      const firstError = validationErrors[0];
      if (firstError) {
        Alert.alert('Validation Error', firstError.message);
      }
      
      setIsSubmitting(false);
      setSubmissionState(null);
      return;
    }

    try {
      // Convert form data to match the expected API format
      const tempBookData = {
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || 'No description provided',
        subject: subject?.trim() || 'General',
        class_level: className.trim(),
        board_university: board.trim(),
        price_inr: isFree ? 0 : isForExchange ? 0 : parseFloat(price),
        is_free: isFree,
        is_for_exchange: isForExchange,
        exchange_details: isForExchange ? 'Open to exchange offers' : undefined,
        location: location.trim(),
        contact_preference: getValidContactPreference(contactPreference),
        contact_phone: contactPreference === 'phone' ? phone.trim() : undefined,
        contact_whatsapp: contactPreference === 'whatsapp' ? phone.trim() : undefined,
        images: [], // Will be populated with uploaded URLs
        metadata: {
          app_version: '1.0.0',
          platform: Platform.OS,
          submission_id: submissionId,
          start_time: startTime,
          device_locale: Intl.DateTimeFormat().resolvedOptions().locale
        }
      };

      function getValidContactPreference(pref?: ContactPreference): ContactPreference {
        const validPrefs = ['in_app', 'whatsapp', 'phone'];
        return validPrefs.includes(pref || '') ? pref : 'in_app';
      }
      
      function getValidCondition(cond?: BookCondition): BookCondition {
        const validConditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
        const normalized = cond?.trim();
        return validConditions.includes(normalized || '') ? normalized : 'Good';
      }
      
      log('Processing book listing data', { submissionId, isEditMode });

      try {
        // First, ensure user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('You must be logged in to create/update a book listing');
        }

        if (isEditMode && !id) {
          throw new Error('No book ID provided for update');
        }

        // Get existing book listing if in edit mode
        let existingListing;
        let bookId;
        
        if (isEditMode) {
          const { data: listingData, error: listingError } = await supabase
            .from('book_listings')
            .select(`
              id,
              book_id,
              images:book_images(url)
            `)
            .eq('id', id)
            .maybeSingle();

          if (listingError) {
            throw new Error('Failed to fetch existing listing: ' + listingError.message);
          }

          if (!listingData) {
            throw new Error('Book listing not found');
          }

          log('Existing listing data:', { listingData });
          existingListing = listingData;
          bookId = listingData.book_id;
        }

        // Create book data from form fields
        const bookData = {
          title: title.trim(),
          author: author.trim(),
          description: description.trim(),
          subject: subject?.trim() || 'General',
          class_level: className.trim(),
          board_university: board.trim()
        };

        // Create tempListing object with form data
        const tempListing = {
          price_inr: isFree ? 0 : isForExchange ? 0 : parseFloat(price),
          is_free: isFree,
          is_for_exchange: isForExchange,
          exchange_details: isForExchange ? 'Open to exchange offers' : undefined,
          location: location.trim(),
          contact_preference: getValidContactPreference(contactPreference),
          contact_phone: contactPreference === 'phone' ? phone.trim() : undefined,
          contact_whatsapp: contactPreference === 'whatsapp' ? phone.trim() : undefined
        };

        // For new listings, we don't have a book_id yet
        const upsertQuery = isEditMode 
          ? supabase
              .from('books')
              .upsert(bookData)
              .eq('id', bookId)
          : supabase
              .from('books')
              .insert(bookData);

        const { data: book, error: bookError } = await upsertQuery
          .select('id, title, author')
          .single();

        if (bookError) {
          throw new Error('Failed to update book: ' + bookError.message);
        }

        if (!book) {
          throw new Error('Book not found');
        }

        log('Book updated successfully:', book);

        // Create or update listing
        const listingData = {
          seller_id: user.id,  // Add seller_id from authenticated user
          condition: getValidCondition(condition).toLowerCase().replace(' ', '_') as 'new' | 'like_new' | 'good' | 'fair' | 'poor',
          price_inr: tempListing.price_inr,
          is_free: tempListing.is_free,
          is_for_exchange: tempListing.is_for_exchange,
          exchange_details: tempListing.exchange_details,
          location: tempListing.location,
          contact_preference: tempListing.contact_preference,
          contact_phone: tempListing.contact_phone,
          contact_whatsapp: tempListing.contact_whatsapp,
          is_sold: false,
          is_active: true,
          book_id: book.id  // Add book_id reference
        };

        log('Creating/updating listing data:', { listingData });

        const { data: listing, error: listingError } = await supabase
          .from('book_listings')
          .insert(listingData)
          .select('id')
          .single();

        if (listingError || !listing) {
          throw new Error('Failed to create/update listing: ' + (listingError?.message || 'Unknown error'));
        }

        // Handle images
        const imageUrls: string[] = [];
        
        try {
          // Upload new images
          for (let i = 0; i < images.length; i++) {
            const imageUrl = await uploadImageToStorage(images[i], listing.id, i);
            imageUrls.push(imageUrl);
          }

          // Upload the images to the book_images table
          const imageRecords = imageUrls.map((url) => ({
            listing_id: listing.id,
            url: url,
            created_at: new Date().toISOString()
          }));

          const { error: imageError } = await supabase
            .from('book_images')
            .insert(imageRecords);

          if (imageError) {
            logError('Failed to save images to database', { error: imageError });
            throw new Error(`Failed to save images: ${imageError.message}`);
          }
            
          log(`${imageRecords.length} images saved to database`);
        } catch (error) {
          logError('Failed to process images', { error });
          throw new Error('Failed to process images');
        }
          
        // Prepare and return the final book data
        const finalBookData = {
          id: listing.id,
          book_id: book.id,
          title: title,
          author: author,
          description: description,
          subject: subject || 'General',
          class_level: className,
          board_university: board,
          condition: condition,
          price_inr: tempListing.price_inr,
          is_free: tempListing.is_free,
          is_for_exchange: tempListing.is_for_exchange,
          location: location,
          contact_preference: tempListing.contact_preference,
          contact_phone: tempListing.contact_phone,
          contact_whatsapp: tempListing.contact_whatsapp,
          images: imageUrls,
          metadata: {
            app_version: '1.0.0',
            platform: Platform.OS,
            submission_id: submissionId,
            start_time: startTime,
            device_locale: Intl.DateTimeFormat().resolvedOptions().locale
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };  
        
        // Log success (sensitive info redacted)
        log('Book listing created successfully', {
          ...finalBookData,
          images: `Array(${imageUrls.length})`,
          submission_id: submissionId,
          listingId: listing.id,
          totalDuration: Date.now() - startTime
        });
        
        // Show success message and navigate
        Alert.alert('Success', 'Your book has been listed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              log('User acknowledged success message', { submissionId });
              router.replace({
                pathname: '/(tabs)/book-bazaar',
                params: { refresh: 'true' }
              });
            }
          }
        ]);
        
        log('Form submission completed', { 
          submissionId,
          status: 'success',
          totalDuration: Date.now() - startTime,
          listingId: listing.id
        });
        
        return bookData;
        
      } catch (error: any) {
        logError('Error during image upload or book creation', { 
          submissionId,
          error: error
        });
        throw error;
      }
      
    } catch (error: any) {
      const errorId = `err_${Date.now()}`;
      const errorDuration = Date.now() - startTime;
      
      logError('Book submission failed', { 
        submissionId,
        errorId,
        error: error?.message || 'Unknown error',
        duration: errorDuration,
        errorDetails: process.env.NODE_ENV === 'development' ? error : undefined,
        formData: process.env.NODE_ENV === 'development' ? formData : undefined
      });
      
      let errorMessage = 'Failed to list your book. Please try again.';
      
      // Handle specific error cases
      if (error?.message) {
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'Permission denied. Please make sure you are logged in.';
        } else if (error.message.includes('network') || error.message.includes('offline')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Invalid data. Please check your input and try again.';
        } else if (error.message.includes('Failed to save images')) {
          errorMessage = 'Failed to save book images. Please try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
      
      log('Showing error to user', { 
          submissionId,
          errorId,
          error: errorMessage,
        userFriendlyMessage: errorMessage 
      });
      
      Alert.alert(
        'Error', 
        `${errorMessage} (Ref: ${errorId})`,
        [
          {
            text: 'OK',
            onPress: () => log('User acknowledged error', { 
              submissionId, 
              errorId 
            })
          },
          {
            text: 'Retry',
            onPress: () => {
              log('User chose to retry submission', { 
                submissionId, 
                previousErrorId: errorId 
              });
              handleSubmit();
            },
            style: 'default'
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
      setSubmissionState(null);
    }
  };

  // Log render
  log('Rendering PostAdScreen');
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading book details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (id) {
                loadBookData();
              } else {
                setError(null);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Ad' : 'Post an Ad'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Book Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Photos *</Text>
          <Text style={styles.sectionSubtitle}>Add up to 5 photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <ImageIcon size={24} color={colors.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Book Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Details</Text>
          
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Book Title"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Author *</Text>
          <TextInput
            style={styles.input}
            value={author}
            onChangeText={setAuthor}
            placeholder="Author Name"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Edition (Optional)</Text>
          <TextInput
            style={styles.input}
            value={edition}
            onChangeText={setEdition}
            placeholder="e.g., 3rd Edition"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Mathematics, Physics"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Class/Grade</Text>
          <TextInput
            style={styles.input}
            value={className}
            onChangeText={setClassName}
            placeholder="e.g., 10th, B.Tech 2nd Year"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Board/University</Text>
          <View style={{ position: 'relative', zIndex: 90 }}>
            <TouchableOpacity 
              style={[styles.input, styles.dropdownTrigger]}
              onPress={() => setShowBoardDropdown(!showBoardDropdown)}
            >
            <Text style={{ color: board ? colors.text : '#666' }}>
                {board || 'Select Board/University'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            
            {showBoardDropdown && (
            <View style={styles.dropdown}>
              {boards.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setBoard(item);
                    setShowBoardDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                  {board === item && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}            </View>
          )}
          </View>

          <Text style={styles.label}>Condition</Text>
          <View style={{ position: 'relative', zIndex: 90 }}>
            <TouchableOpacity 
              style={[styles.input, styles.dropdownTrigger]}
              onPress={() => setShowConditionDropdown(!showConditionDropdown)}
            >
              <Text style={{ color: colors.text, flex: 1 }}>{condition}</Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            
          
            {showConditionDropdown && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={{ maxHeight: 200 }}
                  showsVerticalScrollIndicator={true}
                >
                  {conditions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCondition(item);
                        setShowConditionDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' ')}
                      </Text>
                      {condition === item && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          {/* Pricing */}
          <Text style={styles.label}>Pricing</Text>
          
          <View style={styles.priceOptions}>
            <TouchableOpacity
              style={[styles.option, isFree && styles.optionSelected]}
              onPress={() => {
                log('Pricing option selected', { previous: isFree, new: true });
                setIsFree(true);
                setIsForExchange(false);
              }}
            >
              <Text style={[styles.priceOptionText, isFree && styles.priceOptionTextActive]}>
                Free
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, isForExchange && styles.optionSelected]}
              onPress={() => {
                log('Pricing option selected', { previous: isForExchange, new: true });
                setIsForExchange(true);
                setIsFree(false);
              }}
            >
              <Text style={[styles.priceOptionText, isForExchange && styles.priceOptionTextActive]}>
                Exchange
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.priceOption, styles.priceInputContainer, !isFree && !isForExchange && styles.priceOptionActive]}>
              <Text style={[styles.currencySymbol, !isFree && !isForExchange && styles.priceOptionTextActive]}>
                ₹
              </Text>
              <TextInput
                style={[styles.priceInput, !isFree && !isForExchange && styles.priceOptionTextActive]}
                value={price}
                onChangeText={(text) => {
                  log('Price changed', { previous: price, new: text });
                  setPrice(text);
                }}
                placeholder="Price"
                placeholderTextColor={!isFree && !isForExchange ? 'rgba(255,255,255,0.7)' : '#666'}
                keyboardType="numeric"
                onFocus={() => {
                  log('Price input focused');
                  setIsFree(false);
                  setIsForExchange(false);
                }}
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={(text) => {
              log('Location changed', { previous: location, new: text });
              setLocation(text);
            }}
            placeholder="e.g., IIT Delhi, Delhi"
            placeholderTextColor="#666"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(text) => {
              log('Description changed', { previous: description, new: text });
              setDescription(text);
            }}
            placeholder="Add any additional details about the book"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(text) => {
              log('Phone number changed', { previous: phone, new: text });
              setPhone(text);
            }}
            placeholder="Your phone number"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.label}>Preferred Contact Method</Text>
          <View style={styles.contactOptions}>
            <TouchableOpacity 
              style={[styles.option, contactPreference === 'whatsapp' && styles.optionSelected]}
              onPress={() => {
                log('Contact preference changed', { previous: contactPreference, new: 'whatsapp' });
                setContactPreference('whatsapp');
              }}
            >
              <Text style={[styles.contactOptionText, contactPreference === 'whatsapp' && styles.contactOptionTextActive]}>
                WhatsApp
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, contactPreference === 'phone' && styles.optionSelected]}
              onPress={() => {
                log('Contact preference changed', { previous: contactPreference, new: 'phone' });
                setContactPreference('phone');
              }}
            >
              <Text style={[styles.contactOptionText, contactPreference === 'phone' && styles.contactOptionTextActive]}>
                Call
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.option, contactPreference === 'in-app' && styles.optionSelected]}
              onPress={() => {
                log('Contact preference changed', { previous: contactPreference, new: 'in-app' });
                setContactPreference('in-app');
              }}
            >
              <Text style={[styles.contactOptionText, contactPreference === 'in-app' && styles.contactOptionTextActive]}>
                In-app Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (isSubmitting || !title || !author || (!isFree && !isForExchange && !price) || !location || images.length === 0) && 
            styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !title || !author || (!isFree && !isForExchange && !price) || !location || images.length === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isEditMode ? 'Update Ad' : 'Post Ad'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000000',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#000000',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#a0a0ff',
    marginBottom: 12,
    lineHeight: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  imageWrapper: {
    position: 'relative',
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  image: {
    width: 100,
    height: 140,
    backgroundColor: '#2a2a4a',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addImageButton: {
    width: 100,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5856D6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 86, 214, 0.1)',
    margin: 4,
  },
  addImageText: {
    color: '#a0a0ff',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 14,
    color: '#a0a0ff',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
    zIndex: 1, // Ensure trigger stays above other elements
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.5)',
    zIndex: 9999, // Higher z-index to ensure it's on top
    elevation: 9999, // Higher for Android
    marginTop: 4,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  priceOptions: {
    flexDirection: 'row',
    marginTop: 8,
    marginHorizontal: -4,
  },
  priceOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
  },
  priceOptionActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderColor: '#007AFF',
  },
  option: {
    padding: 12,
    borderRadius: 12,
    margin: 4,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderColor: '#007AFF',
  },
  priceOptionText: {
    color: '#a0a0ff',
    fontWeight: '500',
  },
  priceOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
    height: 56,
  },
  currencySymbol: {
    color: '#a0a0ff',
    fontSize: 16,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
    paddingTop: 16,
    lineHeight: 22,
  },
  contactOptions: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  contactOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
    backgroundColor: '#1a1a2e',
  },
  contactOptionActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderColor: '#007AFF',
  },
  contactOptionText: {
    color: '#a0a0ff',
    fontWeight: '500',
  },
  contactOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a4a',
    opacity: 0.7,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
