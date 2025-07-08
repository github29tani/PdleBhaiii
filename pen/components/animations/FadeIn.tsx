import React, { useEffect } from 'react';
import { Animated, ViewProps, Platform } from 'react-native';

interface FadeInProps extends ViewProps {
  duration?: number;
  delay?: number;
  from?: number;
  children: React.ReactNode;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 300,
  delay = 0,
  from = 0,
  style,
  ...props
}) => {
  const opacity = new Animated.Value(from);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};