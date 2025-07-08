import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { SubscriptionTier } from '../types/subscription';
import { Database } from '../types/database.types';

export { SubscriptionTier };

type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused';

interface SubscriptionState {
  isPremium: boolean;
  subscriptionTier: SubscriptionTier;
  expiryDate: Date | null;
  isLoading: boolean;
  error: string | null;
  subscription: (Database['public']['Tables']['user_subscriptions']['Row'] & { status: SubscriptionStatus }) | null;
  checkSubscription: (userId: string) => Promise<void>;
  clearSubscription: () => void;
  refreshSubscription: () => Promise<void>;
  getSubscriptionTier: (priceId: string) => SubscriptionTier;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPremium: false,
  subscriptionTier: SubscriptionTier.FREE,
  expiryDate: null,
  isLoading: false,
  error: null,
  subscription: null,
  
  getSubscriptionTier: (priceId: string): SubscriptionTier => {
    if (!priceId) return SubscriptionTier.FREE;
    const lowerPriceId = priceId.toLowerCase();
    if (lowerPriceId.includes('premium')) return SubscriptionTier.PREMIUM;
    if (lowerPriceId.includes('pro')) return SubscriptionTier.PRO;
    return SubscriptionTier.FREE;
  },
  
  checkSubscription: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // First, check if we have a subscription in the database
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      
      if (subscription) {
        const isActive = new Date(subscription.current_period_end) > new Date() && 
                        ['active', 'trialing'].includes(subscription.status);
        const tier = get().getSubscriptionTier(subscription.price_id);
        
        set({
          isPremium: isActive && tier !== SubscriptionTier.FREE,
          subscriptionTier: tier,
          expiryDate: new Date(subscription.current_period_end),
          subscription: {
            ...subscription,
            status: subscription.status as SubscriptionStatus,
          },
        });
      } else {
        set({
          isPremium: false,
          subscriptionTier: SubscriptionTier.FREE,
          expiryDate: null,
          subscription: null,
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      set({ 
        error: 'Failed to check subscription status',
        isPremium: false,
        subscriptionTier: SubscriptionTier.FREE,
        expiryDate: null,
        subscription: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  refreshSubscription: async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user?.id;
    if (userId) {
      await get().checkSubscription(userId);
    }
  },
  
  clearSubscription: () => {
    set({
      isPremium: false,
      subscriptionTier: SubscriptionTier.FREE,
      expiryDate: null,
      subscription: null,
    });
  },
}));

// Helper function to get subscription benefits
export const getSubscriptionBenefits = (tier: SubscriptionTier) => {
  switch (tier) {
    case SubscriptionTier.PREMIUM:
      return [
        'Ad-free experience',
        'Advanced analytics',
        'Priority support',
        'Exclusive content',
      ];
    case SubscriptionTier.PRO:
      return [
        'All Premium benefits',
        'Early access to new features',
        'Custom study plans',
        '1:1 coaching sessions',
      ];
    default:
      return [
        'Basic features',
        'Limited analytics',
        'Community support',
      ];
  }
};
