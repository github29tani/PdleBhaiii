import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Database } from '@/types/database.types'
import 'react-native-url-polyfill/auto'

// Fallback credentials for local development; replace with env vars in production
const DEFAULT_SUPABASE_URL = 'https://sulznkznjuhxbjpmjviv.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bHpua3puanVoeGJqcG1qdml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjA2MzAsImV4cCI6MjA2MDYzNjYzMH0.oQdMZMSACnKgTaI2vhB6RuH9s2C3ChIj5wbOodSQxl4'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

// Use AsyncStorage only on native; it breaks on web
const storage = typeof window === 'undefined' ? AsyncStorage : undefined

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: storage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
  }
)

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  anonKey: `${supabaseAnonKey.substring(0, 10)}...`,
})
