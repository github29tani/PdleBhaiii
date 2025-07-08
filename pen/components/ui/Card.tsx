import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Scale } from '../animations/Scale';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  animated?: boolean;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  animated = false,
  delay = 0,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  const content = (
    <CardComponent
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </CardComponent>
  );

  if (animated) {
    return (
      <Scale delay={delay} duration={400}>
        {content}
      </Scale>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});