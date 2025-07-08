import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { Users, Tag, Star, Award, Plus, X } from 'lucide-react-native';
import { useQuery, useQueryClient, InvalidateQueryFilters } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CreateGroupForm } from './CreateGroupForm';

// Group types
type Group = {
  id: string;
  name: string;
  subject: string;
  type: 'public' | 'private' | 'invite-only';
  member_count: number;
  verified: boolean;
  rating: number;
};

export function GroupListModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const invalidateQueries = queryClient.invalidateQueries as (filters?: InvalidateQueryFilters) => Promise<void>;
  
  // Fetch groups
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('member_count', { ascending: false });
      
      if (error) throw error;
      return data as Group[];
    }
  });

  // Group types
  const groupTypes = {
    public: 'Public',
    private: 'Private',
    'invite-only': 'Invite Only',
  };
  
  const handleGroupPress = (groupId: string) => {
    console.log('handleGroupPress called with groupId:', groupId);
    try {
      // Close the modal first
      onClose();
      // Then navigate to the group detail page
      setTimeout(() => {
        router.push(`/groups/${groupId}`);
        console.log('Navigation triggered');
      }, 100); // Small delay to ensure modal is fully closed
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  const handleShowCreateForm = (show: boolean) => {
    console.log('Setting showCreateForm to:', show);
    setShowCreateForm(show);
  };
  
  // Debug logs
  useEffect(() => {
    console.log('GroupListModal rendered', { visible, groupsCount: groups?.length });
    
    return () => {
      console.log('GroupListModal unmounted');
    };
  }, [visible, groups]);
  
  useEffect(() => {
    console.log('GroupListModal visibility changed:', { visible, showCreateForm });
  }, [visible, showCreateForm]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {showCreateForm ? (
        <CreateGroupForm 
          onSuccess={() => {
            setShowCreateForm(false);
            invalidateQueries({ queryKey: ['groups'] });
          }} 
          onCancel={() => handleShowCreateForm(false)} 
        />
      ) : (
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Study Groups</Text>
                <Text style={styles.subtitle}>
                  {groups?.length || 0} {groups?.length === 1 ? 'group' : 'groups'} available
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => setShowCreateForm(true)}
                >
                  <Plus size={18} color={colors.background} style={{ marginRight: 4 }} />
                  <Text style={styles.createButtonText}>Create Group</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

          {/* Subject-wise Groups Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject-wise Groups</Text>
            <View style={styles.subjectGroups}>
              <TouchableOpacity style={styles.subjectGroup}>
                <Tag size={24} color={colors.primary} />
                <Text style={styles.subjectText}>NEET Biology</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subjectGroup}>
                <Tag size={24} color={colors.primary} />
                <Text style={styles.subjectText}>SSC Maths</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subjectGroup}>
                <Tag size={24} color={colors.primary} />
                <Text style={styles.subjectText}>CBSE Class 12</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Featured Groups Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Groups</Text>
            {groups?.map((group) => (
              <TouchableOpacity 
                key={group.id} 
                onPress={() => handleGroupPress(group.id)}
                activeOpacity={0.6}
                style={styles.groupCardContainer}
              >
                <Card style={styles.groupCard}>
                  <View style={styles.groupContent}>
                    <View style={styles.groupHeader}>
                      <View>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupSubject}>{group.subject}</Text>
                      </View>
                    </View>
                    <View style={styles.groupFooter}>
                      <View style={styles.memberCount}>
                        <Users size={16} color={colors.primary} />
                        <Text style={styles.memberCountText}>{group.member_count} members</Text>
                      </View>
                      <Text style={styles.groupType}>{groupTypes[group.type]}</Text>
                      {group.verified && (
                        <View style={styles.verifiedBadge}>
                          <Award size={16} color={colors.success} />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                      <View style={styles.ratingContainer}>
                        <Star size={16} color={colors.primary} />
                        <Text style={styles.ratingText}>{group.rating}</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
          </Card>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  groupTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupAdmin: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adminLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  adminName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '90%',
    width: '100%',
    alignSelf: 'center',
    maxWidth: 600, // For larger screens
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4, // Add some horizontal padding
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  subjectGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subjectGroup: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectText: {
    color: colors.primary,
    fontSize: 14,
  },
  groupCardContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupCard: {
    margin: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  groupContent: {
    padding: 16,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  memberCountText: {
    marginLeft: 4,
    color: colors.text,
    fontSize: 14,
  },
  groupType: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  typeText: {
    backgroundColor: colors.primary,
    color: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  groupSubject: {
    color: colors.secondary,
    fontSize: 14,
    marginBottom: 8,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: colors.text,
    fontSize: 14,
  },
});
