import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { colors } from '@/constants/colors';

type Props = {
  onPress: () => void;
};

export function FloatingNotesButton({ onPress }: Props) {
  return (
    <TouchableOpacity 
      style={styles.toggleButton} 
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Pencil size={24} color={colors.background} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    right: 60, // Position it closer to the group button
    top: 14,   // Align with the header
    width: 37,
    height: 37,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
