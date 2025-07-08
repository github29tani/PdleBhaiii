import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';

type Report = {
  id: string;
  user_id: string;
  note_id: string;
  type: 'user' | 'note' | 'inappropriate_content' | 'spam' | 'copyright' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  created_at: string;
  user: {
    name: string;
    username: string;
  };
  note: {
    title: string;
    content: string;
  };
};

export default function AdminReports() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      // First fetch reports with note data
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          note:notes(title, comments)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        throw reportsError;
      }

      // Get unique user IDs from reports
      const userIds = [...new Set(reports?.map(report => report.user_id) || [])];

      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Map profiles to reports
      const reportsWithProfiles = reports?.map(report => ({
        ...report,
        user: profiles?.find(profile => profile.id === report.user_id) || null
      }));

      console.log('Fetched reports with profiles:', reportsWithProfiles);
      return reportsWithProfiles as Report[];
    }
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'resolve' | 'reject' }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'resolve' ? 'resolved' : 'rejected' })
        .eq('id', id);

      if (error) {
        console.error('Error updating report:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    }
  });

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'reviewed':
        return colors.info;
      case 'resolved':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Reports</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView style={styles.reportsList}>
          {reports?.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportType}>
                  <AlertTriangle size={20} color={colors.warning} />
                  <Text style={styles.reportTypeText}>{report.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                    {report.status}
                  </Text>
                </View>
              </View>

              <View style={styles.reportContent}>
                <Text style={styles.reportReason}>{report.description}</Text>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userLabel}>Reporter:</Text>
                  <Text style={styles.userName}>{report.user?.name}</Text>
                  <Text style={styles.userUsername}>@{report.user?.username}</Text>
                </View>

                {report.note && (
                  <View style={styles.userInfo}>
                    <Text style={styles.userLabel}>Reported Note:</Text>
                    <Text style={styles.userName}>{report.note.title}</Text>
                    <Text style={styles.noteContent} numberOfLines={2}>{report.note.content}</Text>
                  </View>
                )}
              </View>

              {report.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => resolveReportMutation.mutate({ id: report.id, action: 'resolve' })}
                  >
                    <CheckCircle size={20} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Resolve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => resolveReportMutation.mutate({ id: report.id, action: 'reject' })}
                  >
                    <XCircle size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  noteContent: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  reportsList: {
    flex: 1,
  },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  reportContent: {
    gap: 12,
  },
  reportReason: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resolveButton: {
    backgroundColor: colors.success + '10',
  },
  rejectButton: {
    backgroundColor: colors.error + '10',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
