import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { colors } from '@/constants/colors';

type Props = {
  onPress: () => void;
};

export function FloatingBookBazaarButton({ onPress }: Props) {
  return (
    <TouchableOpacity 
      style={styles.toggleButton} 
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <BookOpen size={20} color={colors.background} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    right: 105, // Position it closer to notes button
    top: 14,   // Align with the notes button
    padding: 8,
    borderRadius: 23,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});
