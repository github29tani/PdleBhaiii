import { createClient } from '@supabase/supabase-js';
// Centralized client used by legacy hooks. Prefer the top-level `lib/supabase.ts` moving forward.

// Fallback for development; uses env vars first then explicit values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sulznkznjuhxbjpmjviv.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bHpua3puanVoeGJqcG1qdml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjA2MzAsImV4cCI6MjA2MDYzNjYzMH0.oQdMZMSACnKgTaI2vhB6RuH9s2C3ChIj5wbOodSQxl4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
