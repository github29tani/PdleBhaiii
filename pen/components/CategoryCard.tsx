import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Atom, FlaskConical, Dna, SquareEqual, Landmark, Globe, BookOpen, TrendingUp, Code } from 'lucide-react-native';
import { Category } from '@/types';
import { colors } from '@/constants/colors';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/search?category=${category.id}`);
  };
  
  const getIcon = () => {
    const iconProps = { size: 24, color: category.color };
    
    switch (category.icon) {
      case 'atom':
        return <Atom {...iconProps} />;
      case 'flask-conical':
        return <FlaskConical {...iconProps} />;
      case 'dna':
        return <Dna {...iconProps} />;
      case 'square-equal':
        return <SquareEqual {...iconProps} />;
      case 'landmark':
        return <Landmark {...iconProps} />;
      case 'globe':
        return <Globe {...iconProps} />;
      case 'book-open':
        return <BookOpen {...iconProps} />;
      case 'trending-up':
        return <TrendingUp {...iconProps} />;
      case 'code':
        return <Code {...iconProps} />;
      default:
        return <BookOpen {...iconProps} />;
    }
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: `${category.color}15` }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {getIcon()}
      <Text style={[styles.name, { color: category.color }]}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  }
});