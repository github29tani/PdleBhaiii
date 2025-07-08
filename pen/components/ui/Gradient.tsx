import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

interface GradientProps {
  style?: ViewStyle;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'info';
}

export const Gradient: React.FC<GradientProps> = ({
  style,
  colors: customColors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  children,
  variant = 'primary',
}) => {
  const getGradientColors = () => {
    if (customColors && customColors.length > 0) return customColors;

    switch (variant) {
      case 'primary':
        return [colors.primary, '#818CF8']; // Indigo
      case 'secondary':
        return [colors.secondary, '#F472B6']; // Pink
      case 'accent':
        return [colors.accent, '#A78BFA']; // Violet
      case 'success':
        return [colors.success, '#34D399']; // Emerald
      case 'info':
        return [colors.info, '#60A5FA']; // Blue
      default:
        return [colors.primary, '#818CF8'];
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 12,
  },
});