export type EarningTransaction = {
  id: string;
  amount: number;
  type: 'ad_revenue' | 'support_tip' | 'withdrawal';
  status: 'pending' | 'completed';
  date: string;
};

export type Earnings = {
  total: number;
  withdrawable: number;
  history: EarningTransaction[];
};
