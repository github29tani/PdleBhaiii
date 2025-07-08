export type User = {
  id: string
  created_at: string
  name: string
  email: string
  avatar?: string
  bio?: string
  is_verified?: boolean
  verification_reason?: string
  followers: number
  following: number
}

export type Student = {
  id: string
  created_at: string
  name: string
  email: string
  grade: string
  profile_image_url?: string
}

export type Database = {
  public: {
    Tables: {
      students: {
        Row: Student
        Insert: Omit<Student, 'id' | 'created_at'>
        Update: Partial<Omit<Student, 'id' | 'created_at'>>
      },
      profiles: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      },
      ad_stats: {
        Row: {
          id: string
          note_id: string
          views: number
          clicks: number
          revenue: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<{
          id: string
          note_id: string
          views: number
          clicks: number
          revenue: number
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<{
          id: string
          note_id: string
          views: number
          clicks: number
          revenue: number
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>>
      },
      messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<{
          id: string
          thread_id: string
          sender_id: string
          content: string
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<{
          id: string
          thread_id: string
          sender_id: string
          content: string
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>>
      },
      message_threads: {
        Row: {
          id: string
          book_listing_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<{
          id: string
          book_listing_id: string
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<{
          id: string
          book_listing_id: string
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>>
      },
      thread_participants: {
        Row: {
          id: string
          thread_id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<{
          id: string
          thread_id: string
          user_id: string
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<{
          id: string
          thread_id: string
          user_id: string
          created_at: string
          updated_at: string
        }, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
