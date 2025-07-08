import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface VerifiedBadgeProps {
  reason?: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export function VerifiedBadge({ reason, size = 'medium', showTooltip = false }: VerifiedBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => showTooltip && setIsTooltipVisible(!isTooltipVisible)}
        disabled={!showTooltip}
      >
        <Award size={getIconSize()} color={colors.primary} />
      </TouchableOpacity>

      {showTooltip && isTooltipVisible && reason && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{reason}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
    width: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 8,
  },
  tooltipText: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
});
