import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscription-store';
import { colors } from '@/constants/colors';
import { BarChart3, Zap, ArrowLeft, Lock } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export default function PremiumAnalytics() {
  const router = useRouter();
  const { isPremium } = useSubscriptionStore();

  if (!isPremium) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <View style={styles.lockContainer}>
          <Lock size={48} color={colors.primary} />
          <Text style={styles.title}>Premium Feature</Text>
          <Text style={styles.subtitle}>Upgrade to unlock advanced analytics</Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription')}
          >
            <Zap size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Analytics</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.premiumBadge}>
          <Zap size={16} color="#FFD700" fill="#FFD700" />
          <Text style={styles.premiumBadgeText}>PREMIUM</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Your Premium Analytics</Text>
        <Text style={styles.sectionSubtitle}>Exclusive insights and metrics</Text>
        
        {/* Add your premium analytics components here */}
        <View style={styles.placeholder}>
          <BarChart3 size={48} color={colors.primary} />
          <Text style={styles.placeholderText}>Advanced analytics coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  upgradeButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  placeholder: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    marginTop: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
