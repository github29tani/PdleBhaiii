import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { CheckCircle, XCircle, DollarSign, Clock } from 'lucide-react-native';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  payment_method: string;
  payment_details: string;
  user: {
    name: string;
    username: string;
  };
};

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          user:user_id(name, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Withdrawal[];
    }
  });

  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
    }
  });

  const getStatusColor = (status: Withdrawal['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Process Withdrawals</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView style={styles.withdrawalsList}>
          {withdrawals?.map((withdrawal) => (
            <View key={withdrawal.id} style={styles.withdrawalCard}>
              <View style={styles.withdrawalHeader}>
                <View style={styles.amountContainer}>
                  <DollarSign size={20} color={colors.primary} />
                  <Text style={styles.amount}>{formatAmount(withdrawal.amount)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(withdrawal.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(withdrawal.status) }]}>
                    {withdrawal.status}
                  </Text>
                </View>
              </View>

              <View style={styles.withdrawalContent}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{withdrawal.user?.name}</Text>
                  <Text style={styles.userUsername}>@{withdrawal.user?.username}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <Clock size={16} color={colors.textSecondary} />
                  <Text style={styles.detailsText}>{formatDate(withdrawal.created_at)}</Text>
                </View>

                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentMethod}>{withdrawal.payment_method}</Text>
                  <Text style={styles.paymentInfo}>{withdrawal.payment_details}</Text>
                </View>
              </View>

              {withdrawal.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => processWithdrawalMutation.mutate({ id: withdrawal.id, action: 'approve' })}
                  >
                    <CheckCircle size={20} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => processWithdrawalMutation.mutate({ id: withdrawal.id, action: 'reject' })}
                  >
                    <XCircle size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  withdrawalsList: {
    flex: 1,
  },
  withdrawalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  withdrawalContent: {
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentDetails: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  paymentInfo: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: colors.success + '10',
  },
  rejectButton: {
    backgroundColor: colors.error + '10',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
