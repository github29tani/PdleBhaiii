import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { Link, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

type MenuItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
};

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: 'stats-chart', path: '/admin' },
  { title: 'Users', icon: 'people', path: '/admin/users' },
  { title: 'Blocked Users', icon: 'ban', path: '/admin/blocked-users' },
  { title: 'Notes', icon: 'document-text', path: '/admin/notes' },
  { title: 'Analytics', icon: 'bar-chart', path: '/admin/analytics' },
  { title: 'Notifications', icon: 'notifications', path: '/admin/notifications' },
  { title: 'Moderation', icon: 'shield-checkmark', path: '/admin/moderation' },
  { title: 'Settings', icon: 'settings', path: '/admin/settings' },
  { title: 'Admin Roles', icon: 'key', path: '/admin/roles' },
  { title: 'Telegram', icon: 'paper-plane', path: '/admin/telegram' },
  { title: 'Withdrawals', icon: 'cash', path: '/admin/withdrawals' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <ScrollView style={{ width: 250, backgroundColor: '#f5f5f5', padding: 20 }}>
      {menuItems.map((item) => (
        <Link key={item.path} href={item.path as any} asChild>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              marginBottom: 8,
              borderRadius: 8,
              backgroundColor: pathname === item.path ? '#e0e0e0' : 'transparent',
            }}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={pathname === item.path ? '#000' : '#666'}
            />
            <Text
              style={{
                marginLeft: 12,
                fontSize: 16,
                color: pathname === item.path ? '#000' : '#666',
              }}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = {
  sidebar: {
    width: 250,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  } as ViewStyle,
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  } as ViewStyle,
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  } as TextStyle,
  menu: {
    flex: 1,
  } as ViewStyle,
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  } as ViewStyle,
  activeMenuItem: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  } as ViewStyle,
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  } as TextStyle,
  activeMenuText: {
    color: '#007AFF',
    fontWeight: '600',
  } as TextStyle,
};
