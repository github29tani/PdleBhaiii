import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { Bell, Send, ArrowLeft, Edit2, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth-store';

type Target = {
  classes?: string[];
  subjects?: string[];
  boards?: string[];
  languages?: string[];
};

type Notification = {
  id: string;
  title: string;
  message: string;
  target: Target;
  sent_at?: string;
  status: 'sent' | 'scheduled' | 'draft';
  sentTo?: number;
  openRate?: number;
  editable: boolean;
  edit_expires_at?: string;
  deleted_at?: string;
  isEditable: boolean;
};

export default function NotificationCenter() {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [newNotification, setNewNotification] = useState<{
    title: string;
    message: string;
    target: Target;
  }>({
    title: '',
    message: '',
    target: {}
  });

  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const subjects = ['Biology', 'Chemistry', 'Computer Science', 'English', 'Mathematics', 'Physics'];
  const boards = ['CBSE', 'ICSE', 'State Board'];
  const languages = ['English', 'Hindi', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Marathi', 'Tamil', 'Telugu', 'Urdu'];

  const toggleTarget = (category: keyof Target, value: string) => {
    setNewNotification(prev => {
      const currentTargets = prev.target[category] || [];
      const newTargets = currentTargets.includes(value)
        ? currentTargets.filter(t => t !== value)
        : [...currentTargets, value];
      
      return {
        ...prev,
        target: {
          ...prev.target,
          [category]: newTargets.length > 0 ? newTargets : undefined
        }
      };
    });
  };

  const handleSendNow = async () => {
    if (!newNotification.title || !newNotification.message) {
      Alert.alert('Error', 'Please fill in both title and message');
      return;
    }

    try {
      // Clean up empty arrays in target
      const target = Object.fromEntries(
        Object.entries(newNotification.target).filter(([_, value]) => value && value.length > 0)
      );

      console.log('Sending notification with target:', target);

      console.log('Creating notification with:', {
        title: newNotification.title,
        message: newNotification.message,
        target: Object.keys(target).length > 0 ? target : {},
      });

      // First, insert the notification
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: newNotification.title,
          message: newNotification.message,
          target: Object.keys(target).length > 0 ? target : {},
          status: 'sent',
          sent_at: new Date().toISOString(),
          editable: true,
          edit_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        throw notificationError;
      }

      console.log('Created notification:', notification);

      // Get all users that match the target criteria or all users if no target
      // Get all users that match the target criteria
      let query = supabase.from('profiles').select('id');
      
      // Only apply filters if there are targets
      if (Object.keys(target).length > 0) {
        if (target.classes?.length) {
          query = query.contains('classes', target.classes);
        }
        if (target.subjects?.length) {
          query = query.contains('subjects', target.subjects);
        }
        if (target.boards?.length) {
          query = query.contains('boards', target.boards);
        }
      }
      
      // Exclude the current admin user
      query = query.neq('id', user?.id);

      const { data: targetedUsers, error: targetUsersError } = await query;

      if (targetUsersError) {
        console.error('Error fetching users:', targetUsersError);
        throw targetUsersError;
      }

      console.log('Found users to notify:', targetedUsers);

      // Create notification recipients for all users if no target, or matching users if targeted
      if (targetedUsers && targetedUsers.length > 0) {
        const recipients = targetedUsers.map(targetUser => ({
          notification_id: notification.id,
          user_id: targetUser.id
        }));

        console.log('Creating recipients:', {
          notificationId: notification.id,
          recipientCount: recipients.length,
          recipients: recipients
        });

        const { data: createdRecipients, error: recipientsError } = await supabase
          .from('notification_recipients')
          .insert(recipients)
          .select();

        if (recipientsError) {
          console.error('Error creating recipients:', recipientsError);
          throw recipientsError;
        }

        console.log('Created recipients successfully:', {
          count: createdRecipients?.length,
          recipients: createdRecipients
        });
      } else {
        console.log('No users found to send notification to');
      }

      setNewNotification({
        title: '',
        message: '',
        target: {}
      });

      fetchNotifications();
      Alert.alert('Success', 'Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const fetchNotifications = async () => {
    try {
      const now = new Date().toISOString();
      console.log('Fetching notifications at:', now);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .is('deleted_at', null)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Raw notifications data:', data);
      
      // Add isEditable flag to each notification
      const notificationsWithEditFlag = (data || []).map(notification => {
        const isEditable = notification.editable && 
                         notification.edit_expires_at && 
                         new Date(notification.edit_expires_at) > new Date();
        
        console.log('Notification:', {
          id: notification.id,
          title: notification.title,
          editable: notification.editable,
          edit_expires_at: notification.edit_expires_at,
          isEditable
        });
        
        return {
          ...notification,
          isEditable
        };
      });
      
      console.log('Processed notifications:', notificationsWithEditFlag);
      setSentNotifications(notificationsWithEditFlag);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleEdit = async (notification: Notification) => {
    Alert.alert(
      'Edit Notification',
      'Edit functionality coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleDelete = async (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', notification.id);

              if (error) throw error;

              fetchNotifications();
              Alert.alert('Success', 'Notification deleted successfully');
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notifications</Text>
        <Bell size={24} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Send Notification</Text>
        <Text style={styles.subtitle}>Send notifications to your students</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Notification Title"
            placeholderTextColor={colors.textSecondary}
            value={newNotification.title}
            onChangeText={(text) => setNewNotification(prev => ({ ...prev, title: text }))}
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Notification Message"
            placeholderTextColor={colors.textSecondary}
            multiline
            value={newNotification.message}
            onChangeText={(text) => setNewNotification(prev => ({ ...prev, message: text }))}
          />
        </View>

        <Text style={styles.sectionTitle}>Sent Notifications</Text>
        <View style={styles.notificationList}>
          {sentNotifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>
                Sent: {new Date(notification.sent_at!).toLocaleString()}
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
              <View style={styles.actionButtonsContainer}>
                {notification.isEditable && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEdit(notification)}
                    >
                      <Edit2 size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(notification)}
                    >
                      <Trash2 size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
  },
  headerText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  card: {
    padding: 16,
    gap: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  notificationList: {
    marginTop: 16,
  },
  notificationCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
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
});
