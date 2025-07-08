import { Tabs } from 'expo-router';
import { BookOpen, BookMarked, MessageSquare } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { Redirect } from 'expo-router';
import { colors } from '@/constants/colors';
import { View, StyleSheet } from 'react-native';

export default function BookBazaarLayout() {
  const { isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: 'rgba(255,255,255,0.1)',
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: 'rgba(255,255,255,0.1)',
        },
        headerTitleStyle: {
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="my-ads"
        options={{
          title: 'My Ads',
          tabBarIcon: ({ color }) => <BookMarked size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="message-square"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen 
        name="[id]" 
        options={{
          title: 'Book Details',
          href: null, // Hide from tab bar
        }} 
      />
      <Tabs.Screen 
        name="post-ad" 
        options={{
          title: 'Post an Ad',
          href: null, // Hide from tab bar
        }} 
      />
      <Tabs.Screen
        name="messages/chat/[id]" 
        options={{
          title: 'Chat',
          href: null, // Hide from tab bar
        }} 
      />
    </Tabs>
  );
}
