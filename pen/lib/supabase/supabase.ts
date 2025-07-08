import { createClient } from '@supabase/supabase-js';
// Use absolute path for database types to avoid module resolution issues
import { Database } from '@/lib/supabase/database.types';

// Initialize the Supabase client with your project URL and anon key
const supabaseUrl = 'https://sulznkznjuhxbjpmjviv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bHpua3puanVoeGJqcG1qdml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjA2MzAsImV4cCI6MjA2MDYzNjYzMH0.oQdMZMSACnKgTaI2vhB6RuH9s2C3ChIj5wbOodSQxl4';

// For development, you can use direct values, but in production, use environment variables
const config = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || supabaseUrl,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey,
};

if (!config.url || !config.anonKey) {
  throw new Error('Missing Supabase URL or Anon Key. Please check your configuration.');
}

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to get the current user's ID
export const getCurrentUserId = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user.id;
};

// Add this to help with debugging
export const getSupabaseConfig = () => ({
  url: config.url,
  anonKey: config.anonKey ? `${config.anonKey.substring(0, 10)}...` : 'Not set',
});
