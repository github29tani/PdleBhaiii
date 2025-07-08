import React from 'react';
import { Bell as LucideBell } from 'lucide-react-native';

interface BellProps {
  size?: number;
  color?: string;
}

export function Bell({ size = 24, color }: BellProps) {
  return <LucideBell size={size} color={color} />;
}
