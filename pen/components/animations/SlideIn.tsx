import React, { useEffect } from 'react';
import { Animated, ViewProps, Platform } from 'react-native';

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface SlideInProps extends ViewProps {
  duration?: number;
  delay?: number;
  distance?: number;
  direction?: Direction;
  children: React.ReactNode;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  duration = 300,
  delay = 0,
  distance = 50,
  direction = 'bottom',
  style,
  ...props
}) => {
  const translateX = new Animated.Value(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = new Animated.Value(direction === 'top' ? -distance : direction === 'bottom' ? distance : 0);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
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
          transform: [
            { translateX },
            { translateY },
          ],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};