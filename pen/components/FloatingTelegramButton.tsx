import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Send } from 'lucide-react-native';
import { colors } from '@/constants/colors';

type Props = {
  onPress: () => void;
};

export function FloatingTelegramButton({ onPress }: Props) {
  return (
    <TouchableOpacity 
      style={styles.toggleButton} 
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Send size={24} color={colors.background} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    right: 120, // Position it to the left of sticky notes button
    top: 12,
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
  },
});
