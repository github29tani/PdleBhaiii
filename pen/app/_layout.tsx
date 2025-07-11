import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { ErrorBoundary } from './error-boundary';
import { colors } from '../constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { useAuthStore } from '../store/auth-store';
import { supabase } from '../lib/supabase';
import CustomSplash from '../components/CustomSplash';
import * as SplashScreen from 'expo-splash-screen';
import type { Database } from '../types/database.types';

export const unstable_settings = {
  initialRouteName: "(tabs)/index",
};

export default function RootLayout() {
  const { initialize, isAuthenticated, user, setUnreadNotificationCount } = useAuthStore();
  
  useEffect(() => {
    // Initialize auth store
    initialize();
    
    // Hide splash screen after a delay
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await SplashScreen.hideAsync();
    };
    
    hideSplash();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    let channel: any = null;
    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notification_recipients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .is('read_at', null);

        if (isMounted && !error) {
          setUnreadNotificationCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    // Initial load
    loadUnreadCount();

    // Setup real-time subscription
    try {
      channel = supabase
        .channel(`user-notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notification_recipients',
            filter: `user_id=eq.${user.id}`,
          },
          loadUnreadCount
        )
        .subscribe((status: string, err: any) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Notification channel error:', err);
          }
        });
    } catch (error) {
      console.error('Error setting up notification channel:', error);
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch(console.error);
      }
    };
  }, [isAuthenticated, user?.id, setUnreadNotificationCount]);

  const queryClient = new QueryClient();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomSplash>
            <RootLayoutNav />
          </CustomSplash>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Platform.OS === 'ios' ? colors.background : colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="(auth)/login" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="(auth)/signup" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="(auth)/onboarding" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="note/[id]" 
        options={{ 
          title: 'Note Details',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="(tabs)/search" 
        options={{ 
          title: 'Search Notes',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="(tabs)/upload" 
        options={{ 
          title: 'Upload Note',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications',
          animation: 'slide_from_right',
        }} 
      />
    </Stack>
  );
}