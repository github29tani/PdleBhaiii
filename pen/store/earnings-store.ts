import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Earnings, EarningTransaction } from '@/types';
import { supabase } from '@/lib/supabase';

interface EarningsState {
  earnings: Earnings;
  isLoading: boolean;
  error: string | null;
  
  fetchEarnings: () => Promise<void>;
  requestWithdrawal: (amount: number, method: string) => Promise<void>;
  addEarning: (transaction: Omit<EarningTransaction, 'id' | 'date' | 'status'>) => void;
}

export const useEarningsStore = create<EarningsState>()(
  persist(
    (set) => ({
      earnings: {
        total: 0,
        withdrawable: 0,
        history: []
      },
      isLoading: false,
      error: null,
      
      fetchEarnings: async () => {
        set({ isLoading: true, error: null });
        try {
          // Get current user
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('Not authenticated');

          // Get creator profile with total earnings
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('total_earnings')
            .eq('id', session.user.id)
            .single();
          if (profileError) throw profileError;

          // Get earnings history
          const { data: history, error: historyError } = await supabase
            .from('creator_earnings_history')
            .select('*')
            .eq('creator_id', session.user.id)
            .order('created_at', { ascending: false });
          if (historyError) throw historyError;

          // Transform earnings history
          const transformedHistory = history?.map(item => ({
            id: item.id,
            amount: item.amount,
            type: item.type,
            status: 'completed',
            date: item.created_at
          })) || [];

          // Calculate withdrawable amount (total earnings minus pending withdrawals)
          const pendingWithdrawals = transformedHistory
            .filter(tx => tx.type === 'withdrawal' && tx.status === 'pending')
            .reduce((sum, tx) => sum + tx.amount, 0);

          const totalEarnings = profile?.total_earnings || 0;

          set({
            earnings: {
              total: totalEarnings,
              withdrawable: totalEarnings - pendingWithdrawals,
              history: transformedHistory
            },
            isLoading: false
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to fetch earnings", isLoading: false });
        }
      },
      
      requestWithdrawal: async (amount, method) => {
        set({ isLoading: true, error: null });
        try {
          // Get current user
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('Not authenticated');

          // Validate withdrawal amount
          if (amount <= 0) {
            throw new Error("Withdrawal amount must be greater than zero");
          }

          // Create withdrawal record
          const { data: withdrawal, error: withdrawalError } = await supabase
            .from('creator_earnings_history')
            .insert({
              creator_id: session.user.id,
              amount: -amount, // Negative amount for withdrawals
              type: 'withdrawal',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (withdrawalError) throw withdrawalError;

          // Update creator profile
          const { error: updateError } = await supabase.rpc('update_creator_earnings', {
            p_creator_id: session.user.id,
            p_amount: -amount
          });

          if (updateError) throw updateError;

          // Update local state
          const newTransaction: EarningTransaction = {
            id: withdrawal.id,
            amount,
            type: 'withdrawal',
            status: 'pending',
            date: withdrawal.created_at
          };

          set((state) => ({
            earnings: {
              ...state.earnings,
              withdrawable: state.earnings.withdrawable - amount,
              history: [newTransaction, ...state.earnings.history]
            },
            isLoading: false
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to request withdrawal", isLoading: false });
        }
      },
      
      addEarning: async (transaction) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('Not authenticated');

          // Create earning record
          const { data: earning, error: earningError } = await supabase
            .from('creator_earnings_history')
            .insert({
              creator_id: session.user.id,
              amount: transaction.amount,
              type: transaction.type,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (earningError) throw earningError;

          // Update creator profile
          const { error: updateError } = await supabase.rpc('update_creator_earnings', {
            p_creator_id: session.user.id,
            p_amount: transaction.amount
          });

          if (updateError) throw updateError;

          // Update local state
          const newTransaction: EarningTransaction = {
            id: earning.id,
            ...transaction,
            status: 'completed',
            date: earning.created_at
          };

          set((state) => ({
            earnings: {
              total: state.earnings.total + transaction.amount,
              withdrawable: state.earnings.withdrawable + transaction.amount,
              history: [newTransaction, ...state.earnings.history]
            }
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to add earning" });
        }
      }
    }),
    {
      name: 'earnings-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);