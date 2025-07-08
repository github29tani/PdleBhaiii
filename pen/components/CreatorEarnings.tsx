import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

interface CreatorEarningsProps {
  creatorId: string;
}

interface EarningsData {
  currentWeekEarnings: number;
  lastWeekEarnings: number;
  totalEarnings: number;
  adRevenue: number;
  supportTips: number;
}

export const CreatorEarnings: React.FC<CreatorEarningsProps> = ({ creatorId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, [creatorId]);

  const fetchEarnings = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfLastWeek = new Date(now.setDate(now.getDate() - 7));

      // Get current week earnings
      const { data: currentWeekData } = await supabase
        .from('creator_earnings_history')
        .select('amount, type')
        .eq('creator_id', creatorId)
        .gte('created_at', startOfWeek.toISOString());

      // Get last week earnings
      const { data: lastWeekData } = await supabase
        .from('creator_earnings_history')
        .select('amount, type')
        .eq('creator_id', creatorId)
        .gte('created_at', startOfLastWeek.toISOString())
        .lt('created_at', startOfWeek.toISOString());

      // Get total earnings
      const { data: creatorData } = await supabase
        .from('creator_profiles')
        .select('total_earnings')
        .eq('id', creatorId)
        .single();

      // Calculate earnings
      const currentWeekEarnings = currentWeekData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const lastWeekEarnings = lastWeekData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const adRevenue = currentWeekData?.reduce((sum, item) => 
        item.type === 'ad_revenue' ? sum + item.amount : sum, 0) || 0;
      const supportTips = currentWeekData?.reduce((sum, item) => 
        item.type === 'support_tip' ? sum + item.amount : sum, 0) || 0;

      setEarnings({
        currentWeekEarnings,
        lastWeekEarnings,
        totalEarnings: creatorData?.total_earnings || 0,
        adRevenue,
        supportTips
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!earnings) return null;

  const isEarningsUp = earnings.currentWeekEarnings >= earnings.lastWeekEarnings;
  const earningsChange = Math.abs(earnings.currentWeekEarnings - earnings.lastWeekEarnings);
  const changePercentage = earnings.lastWeekEarnings 
    ? ((earningsChange / earnings.lastWeekEarnings) * 100).toFixed(1)
    : '0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings Overview</Text>
        <View style={[
          styles.changeIndicator,
          { backgroundColor: isEarningsUp ? colors.success + '20' : colors.error + '20' }
        ]}>
          {isEarningsUp ? (
            <TrendingUp size={16} color={colors.success} />
          ) : (
            <TrendingDown size={16} color={colors.error} />
          )}
          <Text style={[
            styles.changeText,
            { color: isEarningsUp ? colors.success : colors.error }
          ]}>
            {changePercentage}%
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>₹{earnings.currentWeekEarnings.toFixed(2)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Last Week</Text>
          <Text style={styles.statValue}>₹{earnings.lastWeekEarnings.toFixed(2)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ad Revenue</Text>
          <Text style={styles.statValue}>₹{earnings.adRevenue.toFixed(2)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Support Tips</Text>
          <Text style={styles.statValue}>₹{earnings.supportTips.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>₹{earnings.totalEarnings.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalCard: {
    backgroundColor: colors.primary + '20',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
