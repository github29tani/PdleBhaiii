import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import { Card } from './ui/Card';
import { colors } from '@/constants/colors';
import { X, Users, Link as LinkIcon } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type TelegramGroup = {
  id: string;
  name: string;
  link: string;
  description: string;
  member_count: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function TelegramGroupsModal({ visible, onClose }: Props) {
  const { data: groups, isLoading } = useQuery({
    queryKey: ['telegramGroups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('member_count', { ascending: false });
      
      if (error) throw error;
      return data as TelegramGroup[];
    }
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Study Groups</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Text style={styles.loadingText}>Loading groups...</Text>
          ) : (
            <ScrollView style={styles.groupsList}>
              {groups?.map((group) => (
                <Card key={group.id} style={styles.groupCard}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.description}>{group.description}</Text>
                  
                  <View style={styles.stats}>
                    <View style={styles.memberCount}>
                      <Users size={16} color={colors.success} />
                      <Text style={styles.memberText}>
                        {group.member_count} members
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => Linking.openURL(group.link)}
                    >
                      <LinkIcon size={16} color={colors.background} />
                      <Text style={styles.joinButtonText}>Join Group</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </ScrollView>
          )}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  groupsList: {
    marginTop: 12,
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.background,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
  },
});
