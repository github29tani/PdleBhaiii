import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { FontAwesome } from '@expo/vector-icons';

interface StatsCardProps {
  icon: keyof typeof FontAwesome.glyphMap;
  title: string;
  value: number | string;
  trend?: number;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  trend,
  color = '#4B5563',
}) => {
  const trendColor = trend ? (trend > 0 ? '#10B981' : '#EF4444') : color;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name={icon} size={24} color={color} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <FontAwesome
            name={trend > 0 ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={trendColor}
          />
          <Text style={[styles.trendValue, { color: trendColor }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendValue: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});
