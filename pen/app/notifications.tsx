import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/colors';
import { Bell, Trash2 } from 'lucide-react-native';

interface NotificationRecipient {
  notification: {
    id: string;
    title: string;
    message: string;
    sent_at: string;
    target: {
      classes?: string[];
      subjects?: string[];
      boards?: string[];
    };
    deleted_at: string | null;
  };
  read_at: string | null;
  user_id: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  sent_at: string;
  target: {
    classes?: string[];
    subjects?: string[];
    boards?: string[];
  };
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_recipients')
        .select(`
          read_at,
          user_id,
          notification:notifications!notification_id (
            id,
            title,
            message,
            sent_at,
            target,
            deleted_at
          )
        `)
        .eq('user_id', user.id)
        .is('notification.deleted_at', null)
        .order('notification(sent_at)', { ascending: false });

      console.log('Notifications query result:', {
        data,
        error,
        userId: user.id
      });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      // Transform the data to match the Notification type
      const transformedNotifications = (data || []).map((item: any) => {
        console.log('Processing notification:', item);
        return {
          id: item.notification.id,
          title: item.notification.title,
          message: item.notification.message,
          sent_at: item.notification.sent_at,
          target: item.notification.target || {},
          read: item.read_at !== null
        };
      });

      console.log('Transformed notifications:', transformedNotifications);
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const clearAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      Alert.alert(
        'Clear All Notifications',
        'Are you sure you want to mark all notifications as read?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: async () => {
              const now = new Date().toISOString();
              const { error } = await supabase
                .from('notification_recipients')
                .update({ read_at: now })
                .eq('user_id', user.id);

              if (error) throw error;
              await loadNotifications();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadNotifications();
      // Only mark as read after notifications are loaded
      await markAllAsRead();
      // Refresh the list to show updated read status
      await loadNotifications();
    };
    init();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity
            style={[styles.clearButton, notifications.length === 0 && styles.clearButtonDisabled]}
            onPress={clearAllNotifications}
            activeOpacity={0.8}
            disabled={notifications.length === 0}
          >
            <Trash2 size={20} color={colors.background} />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>
                {new Date(notification.sent_at!).toLocaleString()}
              </Text>
              {notification.target && Object.keys(notification.target).length > 0 ? (
                <View style={styles.targetInfo}>
                  {notification.target.classes && (
                    <Text style={styles.targetText}>Classes: {notification.target.classes.join(', ')}</Text>
                  )}
                  {notification.target.subjects && (
                    <Text style={styles.targetText}>Subjects: {notification.target.subjects.join(', ')}</Text>
                  )}
                  {notification.target.boards && (
                    <Text style={styles.targetText}>Boards: {notification.target.boards.join(', ')}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.targetText}>Sent to: Everyone</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  clearButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  clearButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  notificationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  notificationTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  targetInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  targetText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  }
});
