import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../../constants/colors';
import { Card } from '../../../components/ui/Card';
import { Check } from 'lucide-react-native';

interface Target {
  id: string;
  name: string;
}

interface DbNotification {
  id: string;
  title: string;
  message: string;
  sent_at: string;
  classes: { name: string } | null;
  subjects: { name: string } | null;
  boards: { name: string } | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  sent_at: string;
  class_name?: string;
  subject_name?: string;
  board_name?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [classes, setClasses] = useState<Target[]>([]);
  const [subjects, setSubjects] = useState<Target[]>([]);
  const [boards, setBoards] = useState<Target[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    checkAdminStatus();
    loadTargets();
    loadSentNotifications();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        Alert.alert('Unauthorized', 'Only admins can send notifications');
        router.replace('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.replace('/');
    }
  };

  const loadTargets = async () => {
    try {
      // Load classes
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (classError) throw classError;
      setClasses(classData || []);

      // Load subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (subjectError) throw subjectError;
      setSubjects(subjectData || []);

      // Load boards
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id, name')
        .order('name');
      
      if (boardError) throw boardError;
      setBoards(boardData || []);
    } catch (error) {
      console.error('Error loading targets:', error);
      Alert.alert('Error', 'Failed to load notification targets');
    }
  };

  const loadSentNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          sent_at,
          classes:class_id(name),
          subjects:subject_id(name),
          boards:board_id(name)
        `)
        .order('sent_at', { ascending: false })
        .returns<DbNotification[]>();

      if (error) throw error;

      setSentNotifications((data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        sent_at: new Date(notification.sent_at).toLocaleString(),
        class_name: notification.classes?.name,
        subject_name: notification.subjects?.name,
        board_name: notification.boards?.name
      })));
    } catch (error) {
      console.error('Error loading sent notifications:', error);
      Alert.alert('Error', 'Failed to load sent notifications');
    }
  };

  const sendNotification = async () => {
    if (!isAdmin) {
      Alert.alert('Unauthorized', 'Only admins can send notifications');
      return;
    }

    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both title and message');
      return;
    }

    try {
      setSending(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: title.trim(),
          message: message.trim(),
          sender_id: user?.id,
          class_id: selectedClass,
          subject_id: selectedSubject,
          board_id: selectedBoard,
          sent_at: new Date().toISOString(),
        });

      if (notificationError) throw notificationError;

      Alert.alert(
        'Success', 
        'Notification sent to ' + [
          selectedClass ? 'selected class' : 'all classes',
          selectedSubject ? 'selected subject' : 'all subjects',
          selectedBoard ? 'selected board' : 'all boards'
        ].join(', ')
      );
      
      setTitle('');
      setMessage('');
      setSelectedClass(null);
      setSelectedSubject(null);
      setSelectedBoard(null);
      loadSentNotifications(); // Reload sent notifications
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error('Error sending notification:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send Notification</Text>
        <Text style={styles.subtitle}>Send notifications to classes, subjects, or boards</Text>
      </View>

      <Card style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Notification Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.targetsSection}>
          <Text style={styles.targetTitle}>Select Target Audience</Text>
          <Text style={styles.targetSubtitle}>Leave all unselected to send to everyone</Text>

          <View style={styles.targetGroup}>
            <Text style={styles.targetGroupTitle}>Classes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
              {classes.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.targetChip,
                    selectedClass === item.id && styles.targetChipSelected
                  ]}
                  onPress={() => setSelectedClass(selectedClass === item.id ? null : item.id)}
                >
                  <Text style={[
                    styles.targetChipText,
                    selectedClass === item.id && styles.targetChipTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedClass === item.id && (
                    <Check size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.targetGroup}>
            <Text style={styles.targetGroupTitle}>Subjects</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
              {subjects.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.targetChip,
                    selectedSubject === item.id && styles.targetChipSelected
                  ]}
                  onPress={() => setSelectedSubject(selectedSubject === item.id ? null : item.id)}
                >
                  <Text style={[
                    styles.targetChipText,
                    selectedSubject === item.id && styles.targetChipTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedSubject === item.id && (
                    <Check size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.targetGroup}>
            <Text style={styles.targetGroupTitle}>Boards</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
              {boards.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.targetChip,
                    selectedBoard === item.id && styles.targetChipSelected
                  ]}
                  onPress={() => setSelectedBoard(selectedBoard === item.id ? null : item.id)}
                >
                  <Text style={[
                    styles.targetChipText,
                    selectedBoard === item.id && styles.targetChipTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedBoard === item.id && (
                    <Check size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, sending && styles.buttonDisabled]}
          onPress={sendNotification}
          disabled={sending}
        >
          <Text style={styles.buttonText}>
            {sending ? 'Sending...' : 'Send Notification'}
          </Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.sentNotificationsSection}>
        <Text style={styles.sentNotificationsTitle}>Sent Notifications</Text>
        {sentNotifications.map(notification => (
          <Card key={notification.id} style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <View style={styles.notificationMeta}>
              <Text style={styles.notificationTime}>Sent: {notification.sent_at}</Text>
              <View style={styles.notificationTargets}>
                {notification.class_name && (
                  <View style={styles.notificationTarget}>
                    <Text style={styles.notificationTargetText}>Class: {notification.class_name}</Text>
                  </View>
                )}
                {notification.subject_name && (
                  <View style={styles.notificationTarget}>
                    <Text style={styles.notificationTargetText}>Subject: {notification.subject_name}</Text>
                  </View>
                )}
                {notification.board_name && (
                  <View style={styles.notificationTarget}>
                    <Text style={styles.notificationTargetText}>Board: {notification.board_name}</Text>
                  </View>
                )}
                {!notification.class_name && !notification.subject_name && !notification.board_name && (
                  <View style={styles.notificationTarget}>
                    <Text style={styles.notificationTargetText}>Sent to: Everyone</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        ))}
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
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  form: {
    margin: 20,
    padding: 20,
    gap: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  targetsSection: {
    gap: 16,
  },
  targetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  targetSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -12,
  },
  targetGroup: {
    gap: 8,
  },
  targetGroupTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  targetScroll: {
    flexGrow: 0,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  targetChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  targetChipText: {
    fontSize: 14,
    color: colors.text,
  },
  targetChipTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sentNotificationsSection: {
    padding: 20,
    paddingTop: 0,
    gap: 16,
  },
  sentNotificationsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  notificationCard: {
    padding: 16,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  notificationMessage: {
    fontSize: 16,
    color: colors.text,
  },
  notificationMeta: {
    marginTop: 8,
    gap: 8,
  },
  notificationTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationTargets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notificationTarget: {
    backgroundColor: colors.primary + '10',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  notificationTargetText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});
