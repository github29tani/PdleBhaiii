import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Share2, MessageSquare, Phone, MapPin, Clock, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/constants/colors';

// Mock data - in a real app, this would come from an API
const MOCK_BOOK = {
  id: '1',
  title: 'Introduction to Algorithms',
  author: 'Thomas H. Cormen',
  price: '₹500',
  originalPrice: '₹1200',
  condition: 'Like New',
  description: 'Hardly used, no highlights or notes. Bought last semester for my CS course.',
  location: 'IIT Delhi',
  postedBy: 'Rahul K.',
  postedAgo: '2 days ago',
  contactNumber: '+91 98765 43210',
  images: [
    'https://via.placeholder.com/300x400/2D2D3A/FFFFFF?text=Book+Cover',
    'https://via.placeholder.com/300x400/1E1E2D/FFFFFF?text=Inside+Pages',
    'https://via.placeholder.com/300x400/2D2D3A/FFFFFF?text=Back+Cover',
  ],
  academicDetails: {
    board: 'CBSE',
    university: 'IIT',
    class: 'B.Tech',
    course: 'Computer Science',
    subject: 'Algorithms',
  },
};

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // In a real app, fetch book details by ID
  const book = MOCK_BOOK;
  
  const handleContactSeller = () => {
    // Open WhatsApp with a pre-filled message
    const message = `Hi, I'm interested in your book "${book.title}" listed on StudySphere. Is it still available?`;
    const url = `https://wa.me/${book.contactNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(err => console.error('Error opening WhatsApp:', err));
  };
  
  const handleCallSeller = () => {
    Linking.openURL(`tel:${book.contactNumber}`);
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this book on StudySphere: ${book.title} - ${book.price}`,
        url: `https://studysphere.com/book/${id}`,
        title: book.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, update favorite status in the backend
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
          <Heart 
            size={24} 
            color={isFavorite ? '#FF3B30' : colors.text} 
            fill={isFavorite ? '#FF3B30' : 'none'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: book.images[currentImageIndex] }} 
            style={styles.mainImage} 
            resizeMode="contain"
          />
          <View style={styles.imagePagination}>
            {book.images.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.activeDot
                ]} 
              />
            ))}
          </View>
          
          {/* Thumbnails */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailsContainer}
          >
            {book.images.map((img, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.thumbnail,
                  index === currentImageIndex && styles.activeThumbnail
                ]}
              >
                <Image 
                  source={{ uri: img }} 
                  style={styles.thumbnailImage} 
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Book Info */}
        <View style={styles.section}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{book.price}</Text>
            {book.originalPrice && (
              <Text style={styles.originalPrice}>{book.originalPrice}</Text>
            )}
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{book.condition}</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MapPin size={16} color="#666" />
              <Text style={styles.metaText}>{book.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color="#666" />
              <Text style={styles.metaText}>{book.postedAgo}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>

        {/* Academic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Board</Text>
              <Text style={styles.detailValue}>{book.academicDetails.board}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>University</Text>
              <Text style={styles.detailValue}>{book.academicDetails.university}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Class</Text>
              <Text style={styles.detailValue}>{book.academicDetails.class}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Course</Text>
              <Text style={styles.detailValue}>{book.academicDetails.course}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Subject</Text>
              <Text style={styles.detailValue}>{book.academicDetails.subject}</Text>
            </View>
          </View>
        </View>

        {/* Seller Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>{book.postedBy.charAt(0)}</Text>
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{book.postedBy}</Text>
              <Text style={styles.sellerLocation}>{book.location}</Text>
            </View>
            <View style={styles.sellerActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.chatButton]}
                onPress={handleContactSeller}
              >
                <MessageSquare size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.callButton]}
                onPress={handleCallSeller}
              >
                <Phone size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={[styles.section, styles.safetyTips]}>
          <AlertTriangle size={20} color="#FFA500" style={styles.safetyIcon} />
          <Text style={styles.safetyTitle}>Safety Tips</Text>
          <Text style={styles.safetyText}>
            • Meet in a public place or college campus
            • Check the book condition before paying
            • Never pay in advance
            • Be cautious of too-good-to-be-true deals
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleContactSeller}
        >
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    marginBottom: 80, // Space for the fixed footer
  },
  imageContainer: {
    height: 400,
    backgroundColor: '#1E1E2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePagination: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 16,
  },
  thumbnailsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  thumbnail: {
    width: 50,
    height: 70,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 4,
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3A',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  conditionBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  conditionText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#888',
  },
  sellerActions: {
    flexDirection: 'row',
  },
  chatButton: {
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  safetyTips: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    margin: 16,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  safetyIcon: {
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#FFC107',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E2D',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2D2D3A',
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2D2D3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
