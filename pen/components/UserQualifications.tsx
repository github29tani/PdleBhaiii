import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Briefcase, Award } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface UserQualificationsProps {
  experience?: string[];
  qualifications?: string[];
}

export const UserQualifications: React.FC<UserQualificationsProps> = ({ 
  experience = [], 
  qualifications = [] 
}) => {
  return (
    <View style={styles.container}>
      {/* Experience Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Briefcase size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Experience</Text>
        </View>
        {experience.length > 0 ? (
          <View style={styles.itemsList}>
            {experience.map((exp, index) => (
              <View key={`exp-${index}`} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={styles.itemText}>{exp}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No experience added</Text>
        )}
      </View>

      {/* Qualifications Section */}
      <View style={[styles.section, { marginTop: 12 }]}>
        <View style={styles.sectionHeader}>
          <Award size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Qualifications</Text>
        </View>
        {qualifications.length > 0 ? (
          <View style={styles.itemsList}>
            {qualifications.map((qual, index) => (
              <View key={`qual-${index}`} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: '#4CB4E0' }]} />
                <Text style={styles.itemText}>{qual}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No qualifications added</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: 8,
  },
  itemsList: {
    marginLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
