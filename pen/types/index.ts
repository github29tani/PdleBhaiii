export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  interests: string[];
  languages: string[];
  qualifications?: string[];
  experience?: string[];
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
  followers_count: number;
  following_count: number;
  notes_count: number;
  is_following?: boolean;
}

export interface User extends UserProfile {
  email?: string;
  avatar?: string;
  subjects: string[];
  qualifications?: string[];
  experience?: string[];
  is_verified?: boolean;
  verification_reason?: string;
  createdAt: string;
  has_completed_onboarding?: boolean;
  followers?: number;
  following?: number;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  github_url?: string;
  website_url?: string;
}

export interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class: string;
  board: string | null;
  topic: string;
  language: string;
  file_type: 'image' | 'pdf' | 'doc';
  file_url: string;
  thumbnail_url: string | null;
  uploader_id: string;
  likes: number;
  dislikes: number;
  downloads: number;
  comments: number;
  average_rating?: number;
  total_ratings?: number;
  user_rating?: number;
  created_at: string;
  updated_at: string;
  isLiked: boolean;
  isDisliked: boolean;
  isBookmarked: boolean;
  uploaderName?: string;
  uploaderAvatar?: string;
  uploaderIsVerified?: boolean;
  uploader?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface Comment {
  id: string;
  note_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  created_at: string;
  likes: number;
}

export interface Earnings {
  total: number;
  withdrawable: number;
  history: EarningTransaction[];
}

export interface EarningTransaction {
  id: string;
  amount: number;
  type: 'ad_view' | 'download' | 'withdrawal';
  note_id?: string;
  note_name?: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface Board {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface ExamType {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  noteId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  isHelpful: boolean;
  helpfulCount: number;
  reported: boolean;
}

export * from './earnings';