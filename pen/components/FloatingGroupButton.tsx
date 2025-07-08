import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export function FloatingGroupButton({ onPress }: { onPress: () => void }) {
  const handlePress = () => {
    console.log('FloatingGroupButton pressed');
    onPress();
  };
  
  console.log('Rendering FloatingGroupButton');
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <MessageSquare size={24} color={colors.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    zIndex: 1000,
  },
  toggleButton: {
    backgroundColor: colors.primary,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
});
