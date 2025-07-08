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
      books: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          author: string
          description: string | null
          isbn: string | null
          subject: string | null
          class_level: string | null
          board: string | null
          condition: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          author: string
          description?: string | null
          isbn?: string | null
          subject?: string | null
          class_level?: string | null
          board?: string | null
          condition?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          author?: string
          description?: string | null
          isbn?: string | null
          subject?: string | null
          class_level?: string | null
          board?: string | null
          condition?: string | null
          user_id?: string
        }
      }
      book_listings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          book_id: string
          price: number | null
          is_free: boolean
          is_for_exchange: boolean
          location: string
          contact_preference: string[]
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          book_id: string
          price?: number | null
          is_free?: boolean
          is_for_exchange?: boolean
          location: string
          contact_preference: string[]
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          book_id?: string
          price?: number | null
          is_free?: boolean
          is_for_exchange?: boolean
          location?: string
          contact_preference?: string[]
          status?: string
          user_id?: string
        }
      }
      book_images: {
        Row: {
          id: string
          created_at: string
          book_listing_id: string
          url: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          book_listing_id: string
          url: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          book_listing_id?: string
          url?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
