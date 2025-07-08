import { User, Earnings } from '@/types';

export const mockUser: User = {
  id: 'user123',
  name: 'Aryan Sharma',
  email: 'aryan.sharma@example.com',
  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
  bio: 'JEE aspirant | Physics enthusiast | Love to share study materials',
  interests: ['jee', 'class12', 'physics', 'mathematics'],
  subjects: ['physics', 'mathematics', 'chemistry'],
  level: 4,
  xp: 1250,
  followers: 128,
  following: 75,
  createdAt: '2023-08-15T10:30:00Z'
};

export const mockEarnings: Earnings = {
  total: 1250.75,
  withdrawable: 750.50,
  history: [
    {
      id: 'trx1',
      amount: 25.50,
      type: 'ad_view',
      noteId: '1',
      noteName: 'Complete Physics Notes for JEE Main',
      status: 'completed',
      date: '2023-10-15T10:30:00Z'
    },
    {
      id: 'trx2',
      amount: 18.25,
      type: 'download',
      noteId: '2',
      noteName: 'Organic Chemistry Reaction Mechanisms',
      status: 'completed',
      date: '2023-10-10T14:20:00Z'
    },
    {
      id: 'trx3',
      amount: 500.00,
      type: 'withdrawal',
      status: 'completed',
      date: '2023-09-30T09:15:00Z'
    },
    {
      id: 'trx4',
      amount: 32.75,
      type: 'ad_view',
      noteId: '3',
      noteName: 'UPSC Geography Complete Notes',
      status: 'completed',
      date: '2023-09-28T09:15:00Z'
    },
    {
      id: 'trx5',
      amount: 28.50,
      type: 'download',
      noteId: '4',
      noteName: 'Calculus Formulas and Techniques',
      status: 'completed',
      date: '2023-09-25T11:45:00Z'
    }
  ]
};