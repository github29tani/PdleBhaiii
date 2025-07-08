import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface RatingProps {
  rating: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const Rating: React.FC<RatingProps> = ({ 
  rating, 
  size = 20, 
  color = '#FFD700',
  interactive = false,
  onRatingChange 
}) => {
  const stars = Array(5).fill(null);
  
  const handlePress = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };
  
  return (
    <View style={styles.container}>
      {stars.map((_, index) => {
        const filled = index < Math.floor(rating);
        const half = index === Math.floor(rating) && rating % 1 !== 0;
        const starColor = filled || half ? color : '#444';
        
        return (
          <TouchableOpacity 
            key={index} 
            style={styles.starContainer}
            onPress={() => handlePress(index)}
            disabled={!interactive}
            activeOpacity={interactive ? 0.7 : 1}
          >
            <Star
              size={size}
              color={starColor}
              fill={filled || half ? color : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        );
      })}
      {!interactive && (
        <Text style={[styles.ratingText, { color: '#888' }]}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 5,
  },
  ratingText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
});
