import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps {
  children?: React.ReactNode;
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'mini' | 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left'
}) => {
  const getContainerStyle = () => {
    let containerStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'primary':
        containerStyle = {
          backgroundColor: colors.button, // Marsala color for primary buttons
          borderWidth: 1,
          borderColor: colors.button,
        };
        break;
      case 'secondary':
        containerStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary, // Marsala border for secondary buttons
        };
        break;
      case 'outline':
        containerStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primaryLight,
        };
        break;
      case 'ghost':
        containerStyle = {
          backgroundColor: 'transparent',
        };
        break;
    }
    
    // Size styles
    switch (size) {
      case 'mini':
        containerStyle = {
          ...containerStyle,
          paddingVertical: 4,
          paddingHorizontal: 8,
        };
        break;
      case 'small':
        containerStyle = {
          ...containerStyle,
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
        break;
      case 'medium':
        containerStyle = {
          ...containerStyle,
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
        break;
      case 'large':
        containerStyle = {
          ...containerStyle,
          paddingVertical: 16,
          paddingHorizontal: 32,
          minWidth: 150,
        };
        break;
    }
    
    // Disabled style
    if (disabled || isLoading) {
      containerStyle = {
        ...containerStyle,
        opacity: 0.6,
      };
    }
    
    return containerStyle;
  };
  
  const getTextStyle = () => {
    let textStyle: TextStyle = {
      color: variant === 'primary' ? '#000000' : colors.text, // Black text on marsala, white text on dark
      fontWeight: '600',
    };

    // Size-based text styles
    switch (size) {
      case 'mini':
        textStyle.fontSize = 12;
        break;
      case 'small':
        textStyle.fontSize = 14;
        break;
      case 'medium':
        textStyle.fontSize = 16;
        break;
      case 'large':
        textStyle.fontSize = 18;
        break;
    }

    if (variant === 'outline' || variant === 'ghost') {
      textStyle.color = colors.primary;
    }

    if (disabled || isLoading) {
      textStyle.opacity = 0.7;
    }

    return [styles.text, textStyle, textStyle];
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        getContainerStyle(),
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : colors.primary} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {title ? (
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          ) : children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontWeight: '600',
  }
});