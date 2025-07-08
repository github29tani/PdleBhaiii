import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, TouchableOpacityProps, View } from 'react-native';
import { colors } from '@/constants/colors';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'link';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = ({
  children,
  title,
  variant = 'default',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) => {
  const variantStyles = {
    default: {
      button: {
        backgroundColor: disabled ? colors.textTertiary : colors.primary,
        borderWidth: 0,
      },
      text: {
        color: colors.secondary,
      },
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.textTertiary : colors.primary,
      },
      text: {
        color: disabled ? colors.textTertiary : colors.primary,
      },
    },
    ghost: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      text: {
        color: disabled ? colors.textTertiary : colors.primary,
      },
    },
    link: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        minWidth: 'auto',
      },
      text: {
        color: disabled ? colors.textTertiary : colors.primary,
        textDecorationLine: 'underline',
      },
    },
  };

  return (
    <TouchableOpacity
      style={[styles.container, variantStyles[variant].button, style]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              variantStyles[variant].text,
              textStyle,
              disabled && styles.disabledText,
            ]}
          >
            {title || children}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

export { Button };
export default Button;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  // Default variant
  defaultContainer: {
    backgroundColor: colors.primary,
  },
  defaultText: {
    color: colors.secondary, // Changed from 'white' to use theme color
  },
  // Outline variant
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  // Ghost variant
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: colors.primary,
  },
  // Link variant
  linkContainer: {
    backgroundColor: 'transparent',
    padding: 0,
    minWidth: 'auto',
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  // States
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
});
