import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { Globe, BookOpen, DollarSign, Tag } from 'lucide-react-native';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    condition: string;
    cover_image: string;
    edition: number;
    year: number;
    location: string;
  };
  onPress: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: book.cover_image }}
        style={styles.bookImage}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.infoRow}>
          <View style={styles.priceContainer}>
            <DollarSign size={16} color={colors.primary} />
            <Text style={styles.price}>₹{book.price}</Text>
          </View>
          <View style={styles.conditionContainer}>
            <Tag size={16} color={colors.primary} />
            <Text style={styles.condition}>{book.condition}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <Globe size={16} color={colors.primary} />
            <Text style={styles.location}>{book.location}</Text>
          </View>
          <Text style={styles.edition}>
            Edition: {book.edition}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  bookImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  condition: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  edition: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default BookCard;
