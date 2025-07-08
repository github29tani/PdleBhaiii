export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro',
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  discount?: number; // percentage
  trialDays?: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number;
  growthRate: number;
}

export interface BillingInfo {
  name: string;
  email: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: Date;
  paidAt: Date | null;
  pdfUrl: string | null;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  amount: number;
  currency: string;
  description: string;
  quantity: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface SubscriptionBenefit {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  isPro: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  [SubscriptionTier.FREE]: {
    id: 'free',
    name: 'Free',
    description: 'Basic features to get started',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Basic analytics',
      'Community support',
      'Limited notes',
      'Basic templates',
    ],
  },
  [SubscriptionTier.PREMIUM]: {
    id: 'premium',
    name: 'Premium',
    description: 'For serious students who want more',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    isPopular: true,
    trialDays: 7,
    features: [
      'Advanced analytics',
      'Priority support',
      'Unlimited notes',
      'Premium templates',
      'Ad-free experience',
      'Offline access',
    ],
  },
  [SubscriptionTier.PRO]: {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and professionals',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    discount: 20, // 20% discount for annual billing
    features: [
      'All Premium features',
      '1:1 coaching',
      'Custom templates',
      'Early access to new features',
      'Team collaboration',
      'Priority feature requests',
    ],
  },
};

export const SUBSCRIPTION_BENEFITS: SubscriptionBenefit[] = [
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Track your study patterns and improve your learning',
    icon: 'bar-chart',
    isPremium: true,
    isPro: true,
  },
  {
    id: 'templates',
    name: 'Premium Templates',
    description: 'Access to professionally designed study templates',
    icon: 'file-text',
    isPremium: true,
    isPro: true,
  },
  {
    id: 'support',
    name: 'Priority Support',
    description: 'Get help faster with priority support',
    icon: 'life-buoy',
    isPremium: true,
    isPro: true,
  },
  {
    id: 'offline',
    name: 'Offline Access',
    description: 'Access your notes and materials offline',
    icon: 'wifi-off',
    isPremium: true,
    isPro: true,
  },
  {
    id: 'coaching',
    name: '1:1 Coaching',
    description: 'Personalized coaching sessions',
    icon: 'user',
    isPremium: false,
    isPro: true,
  },
  {
    id: 'collaboration',
    name: 'Team Collaboration',
    description: 'Work together with your study group',
    icon: 'users',
    isPremium: false,
    isPro: true,
  },
];
