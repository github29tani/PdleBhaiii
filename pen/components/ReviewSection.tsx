import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import { Rating } from './Rating';
import ReportModal from './ReportModal';
import { useAuth } from '@/hooks/useAuth';
import { ImageCarousel } from '@/components/ImageCarousel';
import { Review } from '@/types';

export type ReviewFilter = 'latest' | 'highest' | 'lowest' | 'helpful';

interface ReviewSectionProps {
  reviews: Review[];
  filter?: ReviewFilter;
  onFilterChange?: (filter: ReviewFilter) => void;
  onWriteReview?: () => void;
  onReportReview?: (reviewId: string) => void;
  averageRating?: number;
  totalReviews?: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  filter = 'latest',
  onFilterChange,
  onWriteReview,
  onReportReview,
  averageRating = 0,
  totalReviews = 0,
}) => {
  const { user } = useAuth();
  const activeFilter = filter;

  const handleFilterChange = (newFilter: ReviewFilter) => {
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const handleReport = (review: Review) => {
    setSelectedReview(review);
    setShowReportModal(true);
  };

  const handleReportSubmit = () => {
    if (selectedReview?.id && onReportReview) {
      onReportReview(selectedReview.id);
    }
    setShowReportModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        <View style={styles.ratingContainer}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <Rating rating={averageRating} size={24} color="#FFD700" />
          <Text style={styles.ratingCount}>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</Text>
        </View>
        {onWriteReview && (
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={onWriteReview}
          >
            <Text style={styles.writeReviewButtonText}>Write a Review</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Controls */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'latest' as const, label: 'Latest' },
          { key: 'highest' as const, label: 'Highest Rated' },
          { key: 'lowest' as const, label: 'Lowest Rated' },
          { key: 'helpful' as const, label: 'Most Helpful' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterButton,
              activeFilter === key && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterChange(key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === key && styles.filterButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Image
                source={{ uri: review.userAvatar || 'default-avatar' }}
                style={styles.userAvatar}
                resizeMode="cover"
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{review.userName}</Text>
                <Rating rating={review.rating} size={16} />
              </View>
              {user?.id !== review.userId && (
                <TouchableOpacity
                  onPress={() => handleReport(review)}
                  style={styles.reportButton}
                >
                  <Text style={styles.reportButtonText}>Report</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.reviewText}>{review.comment}</Text>
            {review.images && review.images.length > 0 && (
              <ImageCarousel images={review.images} />
            )}
            <View style={styles.reviewFooter}>
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
              <TouchableOpacity>
                <Text style={styles.helpfulText}>
                  {review.helpfulCount} Helpful
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No reviews yet
          </Text>
          {onWriteReview && (
            <TouchableOpacity
              onPress={onWriteReview}
              style={styles.writeReviewButton}
            >
              <Text style={styles.writeReviewButtonText}>
                Write the first review
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <ReportModal
        isVisible={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="comment"
        targetId={selectedReview?.id || ''}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  ratingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  ratingCount: {
    fontSize: 14,
    color: '#888',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#6C5CE7',
  },
  filterButtonText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  writeReviewButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
  },
  helpfulText: {
    color: '#6C5CE7',
    fontSize: 12,
  },
  reportButton: {
    padding: 4,
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },

  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 12,
  },
  writeReviewButton: {
    backgroundColor: '#6C5CE7',
    padding: 12,
    borderRadius: 8,
  },
  writeReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  writeReviewButtonTop: {
    alignSelf: 'flex-start',
    backgroundColor: '#6C5CE7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  }
});
