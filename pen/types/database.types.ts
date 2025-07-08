export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      message_threads: {
        Row: {
          id: string
          book_listing_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_listing_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_listing_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          content: string
          read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id: string
          content: string
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          sender_id?: string
          content?: string
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      thread_participants: {
        Row: {
          id: string
          thread_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          user_id?: string
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused'
          price_id: string
          subscription_id: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused'
          price_id: string
          subscription_id: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused'
          price_id?: string
          subscription_id?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
      }
    }
    Views: {
      user_subscription_status: {
        Row: {
          user_id: string
          has_active_subscription: boolean | null
          subscription_tier: string | null
          current_period_end: string | null
        }
      }
    }
    Functions: {
      has_active_subscription: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      get_user_subscription_tier: {
        Args: {
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused'
    }
  }
}
