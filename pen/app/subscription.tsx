import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore, SubscriptionTier } from '@/store/subscription-store';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const SubscriptionScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    isPremium, 
    subscriptionTier, 
    isLoading, 
    checkSubscription, 
    refreshSubscription 
  } = useSubscriptionStore();
  
  const subscriptionStore = useSubscriptionStore();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscription(user.id);
    }
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      Alert.alert('Please sign in to subscribe');
      return;
    }

    // Don't process if already on this plan
    if (isPremium && subscriptionTier === planId) {
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(planId);
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found. Please sign in again.');
      }
      
      // In a real app, this would connect to your payment processor (Stripe, RevenueCat, etc.)
      // For now, we'll simulate the subscription update
      // First, check if the user already has a subscription
      const { data: existingSub, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const status = planId === 'free' ? 'canceled' : 'active';
      const subscriptionData = {
        user_id: user.id,
        price_id: planId,
        subscription_id: existingSub?.subscription_id || `sub_${user.id}_${Date.now()}`,
        status,
        current_period_start: new Date().toISOString(),
        current_period_end: planId === 'free' 
          ? new Date().toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancel_at_period_end: planId === 'free',
        updated_at: new Date().toISOString()
      };

      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update(subscriptionData)
          .eq('user_id', user.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Insert new subscription
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert(subscriptionData);
          
        if (insertError) {
          throw insertError;
        }
      }
      
      // Refresh subscription status
      await refreshSubscription();

      // Update local subscription state
      await refreshSubscription();
      
      // Show success message based on the plan
      const planName = planId === 'free' ? 'Free' : 
                      planId === 'premium' ? 'Premium' : 'Pro';
      
      Alert.alert(
        planId === 'free' ? 'Plan Changed' : 'Subscription Successful!',
        planId === 'free' 
          ? 'You have switched to the Free plan.'
          : `Thank you for subscribing to StudySphere ${planName}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (planId !== 'free') {
                // Only navigate back for paid plans
                router.back();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to process subscription. Please try again.'
      );
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        'Basic note taking',
        'Limited templates',
        'Community support',
        'Basic analytics'
      ],
      buttonText: !isPremium ? 'Current Plan' : 'Switch to Free',
      buttonVariant: !isPremium ? 'outline' : 'primary',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 4.99,
      period: 'month',
      features: [
        'Unlimited notes',
        'All templates',
        'Priority support',
        'Advanced analytics',
        'Offline access',
        'Ad-free experience'
      ],
      buttonText: isPremium && subscriptionTier === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      buttonVariant: isPremium && subscriptionTier === 'premium' ? 'outline' : 'primary',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      period: 'month',
      features: [
        'Everything in Premium',
        '1:1 coaching sessions',
        'Custom templates',
        'Team collaboration',
        'Early access to features'
      ],
      buttonText: isPremium && subscriptionTier === 'pro' ? 'Current Plan' : 'Go Pro',
      buttonVariant: isPremium && subscriptionTier === 'pro' ? 'outline' : 'primary',
      popular: false
    }
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Upgrade to Premium',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.subheader}>
          <Text style={styles.subtitle}>Choose the perfect plan for your needs</Text>
        </View>
        
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <View 
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.popularPlan,
                isPremium && subscriptionTier === plan.id && styles.currentPlan
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>
              
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color={colors.primary} 
                      style={styles.featureIcon} 
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  plan.buttonVariant === 'primary' && styles.primaryButton,
                  plan.buttonVariant === 'secondary' && styles.secondaryButton,
                  plan.buttonVariant === 'outline' && styles.outlineButton,
                  (isProcessing && selectedPlan === plan.id) && styles.processingButton
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={isProcessing || (isPremium && subscriptionTier === plan.id)}
              >
                {isProcessing && selectedPlan === plan.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text 
                    style={[
                      styles.buttonText,
                      (plan.buttonVariant === 'outline' || plan.id === 'free') && { color: colors.primary },
                      (plan.buttonVariant === 'primary' || plan.buttonVariant === 'secondary') && { color: '#fff' }
                    ]}
                  >
                    {plan.buttonText}
                  </Text>
                )}
              </TouchableOpacity>
              
              {plan.id === 'free' && isPremium && (
                <Text style={styles.currentPlanText}>Your current plan</Text>
              )}
            </View>
          ))}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your subscription will automatically renew unless canceled at least 24 hours before the end of the current period.
            You can cancel anytime in your account settings.
          </Text>
          <TouchableOpacity style={styles.termsButton}>
            <Text style={styles.termsText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.termsButton}>
            <Text style={styles.termsText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subheader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  plansContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  popularPlan: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  currentPlan: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 142, 204, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: -30,
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 30,
    transform: [{ rotate: '45deg' }],
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
  period: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
    marginBottom: 6,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  subscribeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
  },
  processingButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentPlanText: {
    textAlign: 'center',
    marginTop: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  termsButton: {
    padding: 8,
  },
  termsText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SubscriptionScreen;
