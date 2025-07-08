import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useStatsStore } from '@/store/stats-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { colors } from '@/constants/colors';
import { BookOpen, Clock, Flame, Star, TrendingUp, Users, BookMarked, BarChart3, Zap, Lock, ArrowUpRight, ChevronRight } from 'lucide-react-native'; 
import { LinearGradient } from 'expo-linear-gradient';

// Premium stats component that's only visible to premium users
const PremiumStats = ({ stats }: { stats: any }) => {
  if (!stats?.premiumStats) return null;
  
  return (
    <View style={styles.premiumCard}>
      <View style={styles.premiumHeader}>
        <View style={styles.premiumBadge}>
          <Zap size={16} color="#FFD700" fill="#FFD700" />
          <Text style={styles.premiumBadgeText}>PREMIUM</Text>
        </View>
        <Text style={styles.premiumTitle}>Advanced Insights</Text>
        <Text style={styles.premiumSubtitle}>Exclusive analytics for premium members</Text>
      </View>
      
      <View style={styles.premiumGrid}>
        <View style={styles.premiumStat}>
          <Text style={styles.premiumStatValue}>{stats.premiumStats.peakStudyHours || 'N/A'}</Text>
          <Text style={styles.premiumStatLabel}>Peak Study Hours</Text>
        </View>
        <View style={styles.premiumStat}>
          <Text style={styles.premiumStatValue}>{stats.premiumStats.retentionRate || '0%'}</Text>
          <Text style={styles.premiumStatLabel}>Retention Rate</Text>
        </View>
      </View>
      
      <View style={styles.premiumInsight}>
        <Text style={styles.insightText}>
          <Text style={{ fontWeight: 'bold' }}>Insight: </Text>
          {stats.premiumStats.insight || 'Your study patterns suggest you learn best in the morning.'}
        </Text>
      </View>
    </View>
  );
};

// Upgrade prompt component
const UpgradePrompt = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <TouchableOpacity style={styles.upgradeCard} onPress={onUpgrade}>
    <LinearGradient
      colors={['#6C5CE7', '#A55EEA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.upgradeGradient}
    >
      <View style={styles.upgradeContent}>
        <View>
          <Text style={styles.upgradeTitle}>Unlock Premium Stats</Text>
          <Text style={styles.upgradeSubtitle}>Get deeper insights and advanced analytics</Text>
        </View>
        <View style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
          <ChevronRight size={16} color="white" />
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// Feature lock component for premium features
const FeatureLock = ({ featureName }: { featureName: string }) => (
  <View style={styles.lockedFeature}>
    <Lock size={16} color="#6C5CE7" />
    <Text style={styles.lockedText}>{featureName} is a premium feature</Text>
  </View>
);

export default function StatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { stats, isLoading: statsLoading, error: statsError, fetchStats } = useStatsStore();
  const { isPremium, subscriptionTier, checkSubscription } = useSubscriptionStore();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Check subscription status on mount
  useEffect(() => {
    const checkSub = async () => {
      if (user) {
        await checkSubscription(user.id);
      }
    };
    checkSub();
  }, [user]);
  
  // Show upgrade prompt after a delay if not premium
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPremium) {
        setShowUpgradePrompt(true);
      }
    }, 10000); // Show after 10 seconds
    
    return () => clearTimeout(timer);
  }, [isPremium]);

  useEffect(() => {
    if (user) {
      fetchStats(user.id);
    }
  }, [user]);

  const handleUpgradePress = () => {
    // Navigate to premium analytics page
    router.push('/premium-analytics');
  };
  
  const handlePremiumFeaturePress = (featureName: string) => {
    // Navigate to premium analytics page directly
    router.push('/premium-analytics');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Please log in to view your stats</Text>
      </SafeAreaView>
    );
  }

  if (statsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (statsError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{statsError}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Your Study Stats</Text>
          {isPremium && (
            <View style={styles.premiumIndicator}>
              <Zap size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
        
        {!isPremium && (
          <UpgradePrompt onUpgrade={handleUpgradePress} />
        )}

        <View style={styles.streakCard}>
          <Flame size={24} color={colors.primary} />
          <Text style={styles.streakCount}>{stats?.studyStreak || 0}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          {stats?.lastStudyDate && (
            <Text style={styles.lastStudied}>
              Last studied: {new Date(stats.lastStudyDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BookOpen size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalDownloads || 0}</Text>
            <Text style={styles.statLabel}>Notes Studied</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalViews || 0}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={24} color={colors.primary} />
            <Text style={styles.statValue}>
              {stats?.averageStudyTime.toFixed(1) || '0'}
            </Text>
            <Text style={styles.statLabel}>Avg. Notes/Day</Text>
          </View>

          <View style={styles.statCard}>
            <BookMarked size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalWishlisted || 0}</Text>
            <Text style={styles.statLabel}>Wishlisted</Text>
          </View>
        </View>
        
        {/* Premium Analytics Card */}
        <View style={[styles.premiumCardContainer, isPremium && styles.premiumCardActive]}>
          <TouchableOpacity 
            style={styles.premiumCardContent}
            onPress={handleUpgradePress}
            activeOpacity={0.8}
          >
            <View style={[styles.lockIconContainer, isPremium && styles.lockIconUnlocked]}>
              {isPremium ? (
                <BarChart3 size={20} color="#6C5CE7" />
              ) : (
                <Lock size={20} color="#6C5CE7" />
              )}
            </View>
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumLockedText}>
                {isPremium ? 'Advanced Analytics' : 'View Advanced Analytics'}
              </Text>
              {!isPremium ? (
                <Text style={styles.premiumLockedSubtext}>Unlock with Premium</Text>
              ) : (
                <Text style={styles.currentPlanText}>Current Plan: {subscriptionTier || 'Premium'}</Text>
              )}
            </View>
            <ArrowUpRight size={16} color="#6C5CE7" />
          </TouchableOpacity>
          
          {isPremium && (
            <TouchableOpacity 
              style={styles.changePlanButton}
              onPress={() => router.push('/subscription?change_plan=true')}
            >
              <Text style={styles.changePlanButtonText}>Change Plan</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Show Premium Stats if user is premium */}
        {isPremium && <PremiumStats stats={stats} />}

        {stats?.mostStudiedSubjects && stats.mostStudiedSubjects.length > 0 && (
          <View style={styles.subjectsCard}>
            <Text style={styles.sectionTitle}>Most Studied Subjects</Text>
            {stats.mostStudiedSubjects.map((subject, index) => (
              <View key={subject.subject} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{subject.subject}</Text>
                <Text style={styles.subjectCount}>{subject.count} notes</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showUpgradePrompt && (
        <UpgradePrompt onUpgrade={handleUpgradePress} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  upgradeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  upgradeGradient: {
    padding: 16,
    borderRadius: 16,
  },
  upgradeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  premiumCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  premiumHeader: {
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  premiumTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  premiumSubtitle: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  premiumGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  premiumStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  premiumStatValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  premiumStatLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    textAlign: 'center',
  },
  premiumInsight: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6C5CE7',
  },
  insightText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  premiumCardContainer: {
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
    overflow: 'hidden',
  },
  premiumCardActive: {
    borderStyle: 'dashed',
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    padding: 16,
  },
  changePlanButton: {
    margin: 12,
    marginTop: 0,
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  changePlanButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  currentPlanText: {
    color: '#A29BFE',
    fontSize: 12,
    marginTop: 2,
  },
  premiumUnlocked: {
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderStyle: 'dashed',
  },
  lockIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lockIconUnlocked: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  premiumLockedSubtext: {
    color: '#A29BFE',
    fontSize: 12,
    marginTop: 2,
  },
  premiumLockedText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeLinkText: {
    color: '#6C5CE7',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  lockedFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  lockedText: {
    color: '#6C5CE7',
    fontSize: 12,
    marginLeft: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add extra padding at bottom
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
  streakCard: {
    backgroundColor: 'rgba(0, 142, 204, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 142, 204, 0.2)',
    elevation: 2,
    shadowColor: '#008ECC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  streakCount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#008ECC',
    marginTop: 8,
    textShadowColor: 'rgba(0, 142, 204, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: '#A0D8FF',
    fontWeight: '500',
    marginTop: 4,
  },
  lastStudied: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6C5CE7',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#E2E2FF',
    fontWeight: '500',
  },
  subjectsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subjectName: {
    fontSize: 16,
    color: colors.text,
  },
  subjectCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
