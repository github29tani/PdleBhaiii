import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '@/constants/colors';
import { Users, Tag, Star, Award } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Group list component
type Group = {
  id: string;
  name: string;
  subject: string;
  type: 'public' | 'private' | 'invite-only';
  member_count: number;
  verified: boolean;
  rating: number;
};

export function GroupList() {
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

  if (isLoading) return <Text>Loading groups...</Text>;

  return (
    <ScrollView style={styles.container}>
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
          <Card key={group.id} style={styles.groupCard}>
            <View style={styles.groupContent}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.groupStats}>
                  <View style={styles.statItem}>
                    <Users size={16} color={colors.text} />
                    <Text style={styles.statText}>{group.member_count} members</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.typeText}>{groupTypes[group.type]}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.groupSubject}>{group.subject}</Text>
              
              <View style={styles.groupFooter}>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  subjectGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
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
  groupCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  groupContent: {
    padding: 16,
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
