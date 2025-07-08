import React, { useEffect } from 'react';
import { Animated, ViewProps, Platform } from 'react-native';

interface ScaleProps extends ViewProps {
  duration?: number;
  delay?: number;
  from?: number;
  to?: number;
  children: React.ReactNode;
}

export const Scale: React.FC<ScaleProps> = ({
  children,
  duration = 300,
  delay = 0,
  from = 0.9,
  to = 1,
  style,
  ...props
}) => {
  const scale = new Animated.Value(from);
  const opacity = new Animated.Value(from === 0 ? 0 : 1);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: to,
        duration,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ scale }],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};