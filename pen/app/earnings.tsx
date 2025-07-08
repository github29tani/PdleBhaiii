import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DollarSign, ArrowDown, ArrowUp, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';
import { useEarningsStore } from '@/store/earnings-store';
import { EarningTransaction } from '@/types';

export default function EarningsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { earnings, fetchEarnings, requestWithdrawal, isLoading } = useEarningsStore();
  
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('upi');
  const [withdrawalId, setWithdrawalId] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check authentication but don't navigate immediately
    if (isAuthenticated) {
      fetchEarnings();
    }
  }, [isAuthenticated]);
  
  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amount > earnings.withdrawable) {
      setError('Amount exceeds your withdrawable balance');
      return;
    }
    
    if (!withdrawalId) {
      setError('Please enter your payment details');
      return;
    }
    
    setError('');
    await requestWithdrawal(amount, withdrawalMethod);
    setShowWithdrawalForm(false);
    setWithdrawalAmount('');
    setWithdrawalId('');
  };
  
  const renderTransactionItem = ({ item }: { item: EarningTransaction }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'ad_revenue':
          return <DollarSign size={20} color={colors.success} />;
        case 'support_tip':
          return <DollarSign size={20} color={colors.info} />;
        case 'withdrawal':
          return <ArrowUp size={20} color={colors.warning} />;
      }
    };
    
    const getStatusIcon = () => {
      switch (item.status) {
        case 'completed':
          return <CheckCircle size={16} color={colors.success} />;
        case 'pending':
          return <Clock size={16} color={colors.warning} />;
      }
    };
    
    const getTitle = () => {
      switch (item.type) {
        case 'ad_revenue':
          return 'Ad View Earnings';
        case 'support_tip':
          return 'Support Tip';
        case 'withdrawal':
          return 'Withdrawal';
      }
    };
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIconContainer}>
          {getIcon()}
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{getTitle()}</Text>
          {item.noteName && (
            <Text style={styles.transactionNote} numberOfLines={1}>
              {item.noteName}
            </Text>
          )}
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString()}
          </Text>
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            item.type === 'withdrawal' ? styles.transactionAmountNegative : styles.transactionAmountPositive
          ]}>
            {item.type === 'withdrawal' ? '-' : '+'}₹{item.amount.toFixed(2)}
          </Text>
          <View style={styles.transactionStatus}>
            {getStatusIcon()}
            <Text style={[
              styles.transactionStatusText,
              item.status === 'completed' ? styles.statusCompleted : 
              item.status === 'pending' ? styles.statusPending : 
              styles.statusFailed
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  // If not authenticated, show a message instead of redirecting
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.authPromptContainer}>
          <Text style={styles.authPromptTitle}>Authentication Required</Text>
          <Text style={styles.authPromptText}>
            Please log in to view your earnings and transaction history.
          </Text>
          <Button
            title="Go to Login"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            style={styles.loginButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your earnings and withdrawals</Text>
      </View>
      
      <View style={styles.balanceContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Earnings</Text>
          <Text style={styles.balanceAmount}>₹{earnings.total.toFixed(2)}</Text>
        </View>
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Withdrawable</Text>
          <Text style={styles.balanceAmount}>₹{earnings.withdrawable.toFixed(2)}</Text>
          <Button
            title="Withdraw"
            onPress={() => setShowWithdrawalForm(true)}
            variant="primary"
            size="small"
            style={styles.withdrawButton}
            disabled={earnings.withdrawable <= 0}
          />
        </View>
      </View>
      
      {showWithdrawalForm && (
        <View style={styles.withdrawalForm}>
          <Text style={styles.withdrawalTitle}>Request Withdrawal</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <Input
            label="Amount (₹)"
            placeholder="Enter amount to withdraw"
            value={withdrawalAmount}
            onChangeText={setWithdrawalAmount}
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodContainer}>
            <TouchableOpacity
              style={[
                styles.methodItem,
                withdrawalMethod === 'upi' && styles.methodSelected
              ]}
              onPress={() => setWithdrawalMethod('upi')}
            >
              <Text 
                style={[
                  styles.methodText,
                  withdrawalMethod === 'upi' && styles.methodTextSelected
                ]}
              >
                UPI
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodItem,
                withdrawalMethod === 'bank' && styles.methodSelected
              ]}
              onPress={() => setWithdrawalMethod('bank')}
            >
              <Text 
                style={[
                  styles.methodText,
                  withdrawalMethod === 'bank' && styles.methodTextSelected
                ]}
              >
                Bank Transfer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodItem,
                withdrawalMethod === 'wallet' && styles.methodSelected
              ]}
              onPress={() => setWithdrawalMethod('wallet')}
            >
              <Text 
                style={[
                  styles.methodText,
                  withdrawalMethod === 'wallet' && styles.methodTextSelected
                ]}
              >
                Wallet
              </Text>
            </TouchableOpacity>
          </View>
          
          <Input
            label={withdrawalMethod === 'upi' ? 'UPI ID' : withdrawalMethod === 'bank' ? 'Account Number' : 'Wallet ID'}
            placeholder={withdrawalMethod === 'upi' ? 'Enter your UPI ID' : withdrawalMethod === 'bank' ? 'Enter your account number' : 'Enter your wallet ID'}
            value={withdrawalId}
            onChangeText={setWithdrawalId}
          />
          
          <View style={styles.withdrawalButtons}>
            <Button
              title="Cancel"
              onPress={() => setShowWithdrawalForm(false)}
              variant="outline"
              style={styles.withdrawalButton}
            />
            <Button
              title="Withdraw"
              onPress={handleWithdrawal}
              isLoading={isLoading}
              style={styles.withdrawalButton}
            />
          </View>
        </View>
      )}
      
      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Transaction History</Text>
        
        <FlatList
          data={earnings.history}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.transactionsList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  balanceContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  withdrawButton: {
    minWidth: 100,
  },
  withdrawalForm: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  withdrawalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: `${colors.error}15`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  methodContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  methodItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  methodSelected: {
    backgroundColor: colors.primaryLight,
  },
  methodText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  methodTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  withdrawalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  withdrawalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionAmountPositive: {
    color: colors.success,
  },
  transactionAmountNegative: {
    color: colors.warning,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionStatusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusCompleted: {
    color: colors.success,
  },
  statusPending: {
    color: colors.warning,
  },
  statusFailed: {
    color: colors.error,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    minWidth: 150,
  }
});