import React, { useEffect, Children, cloneElement, isValidElement } from 'react';
import { View, ViewProps } from 'react-native';

interface StaggerProps extends ViewProps {
  staggerDelay?: number;
  initialDelay?: number;
  children: React.ReactNode;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  staggerDelay = 100,
  initialDelay = 0,
  style,
  ...props
}) => {
  const childrenArray = Children.toArray(children);

  return (
    <View style={style} {...props}>
      {childrenArray.map((child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child, {
            key: index,
            delay: initialDelay + index * staggerDelay,
            ...child.props,
          });
        }
        return child;
      })}
    </View>
  );
};