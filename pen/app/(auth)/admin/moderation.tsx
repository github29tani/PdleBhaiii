import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors } from '@/constants/colors';
import { Flag, CheckCircle, XCircle, MessageCircle, Filter, Search, ChevronDown, ChevronUp, Clock, BarChart2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { router } from 'expo-router';

type ContentReport = {
  id: string;
  note_id: string;
  user_id: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  notes: {
    id: string;
    title: string;
    comments: string;
  }[];
  profiles: {
    id: string;
    name: string;
    username: string;
  } | null;
};

type FilterOptions = {
  status: ContentReport['status'] | 'all';
  type: ContentReport['type'] | 'all';
  dateRange: 'today' | 'week' | 'month' | 'all';
};

export default function ContentModeration() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    type: 'all',

    dateRange: 'all'
  });
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedToday: 0,
    dismissedToday: 0,
    averageResolutionTime: 0
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      console.log('Fetching reports as admin...');
      const { data: reportsData, error: fetchError } = await supabase
        .from('reports')
        .select(`
          id,
          note_id,
          user_id,
          type,
          status,
          description,
          created_at,
          updated_at,
          notes:notes(id, title, comments)
        `)
        .returns<Omit<ContentReport, 'profiles'>[]>()
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching reports:', fetchError);
        throw fetchError;
      }

      if (!reportsData) {
        console.log('No reports found');
        setReports([]);
        return;
      }

      console.log('Got reports, fetching user profiles...');
      const userIds = reportsData.map(report => report.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username')
        .in('id', userIds)
        .returns<{ id: string; name: string; username: string; }[]>();

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Merge the profiles data with reports
      const reportsWithProfiles = reportsData.map(report => ({
        ...report,
        notes: [report.notes[0]], // Wrap in array to match type
        profiles: profilesData?.find(p => p.id === report.user_id) || null
      })) satisfies ContentReport[];

      setReports(reportsWithProfiles);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }
      console.log('Fetched data:', reportsWithProfiles);
      setReports(reportsWithProfiles);

      // Calculate statistics
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const pendingReports = reportsData?.filter((r) => r.status === 'pending').length || 0;
      const resolvedReports = reportsData?.filter((r) => r.status === 'resolved').length || 0;
      const rejectedReports = reportsData?.filter((r) => r.status === 'rejected').length || 0;

      // Calculate average resolution time
      const resolvedCount = reportsData?.filter((r) => r.status === 'resolved').length || 0;
      const totalResolutionTime = reportsData?.reduce((acc: number, report) => {
        if (report.status === 'resolved') {
          const createdAt = new Date(report.created_at);
          const updatedAt = new Date(report.updated_at);
          return acc + (updatedAt.getTime() - createdAt.getTime());
        }
        return acc;
      }, 0) || 0;
      
      const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

      setStats({
        totalReports: reportsData?.length || 0,
        pendingReports,
        resolvedToday: resolvedReports,
        dismissedToday: rejectedReports,
        averageResolutionTime: avgResolutionTime
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      console.error('Error fetching reports:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'resolved' | 'rejected') => {
    console.log('Bulk action:', action, 'for reports:', Array.from(selectedReports));
    if (selectedReports.size === 0) {
      Alert.alert('Error', 'Please select at least one report');
      return;
    }

    try {
      const promises = Array.from(selectedReports).map(reportId =>
        supabase.rpc('manage_content_report', {
          p_report_id: reportId,
          p_status: action,
          p_resolution_note: `Bulk ${action} action`,
          p_resolver_id: user?.id
        })
      );

      await Promise.all(promises);
      setSelectedReports(new Set());
      fetchReports();
      Alert.alert('Success', `${selectedReports.size} reports ${action} successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reports';
      console.error('Error updating reports:', errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleResolve = async (reportId: string, action: 'resolved' | 'rejected') => {
    console.log('Resolving report:', reportId, 'with action:', action);
    try {
      const { error: updateError } = await supabase
        .rpc('manage_content_report', {
          p_report_id: reportId,
          p_status: action,
          p_resolution_note: action === 'resolved' ? 'Content reviewed and approved' : 'Report dismissed',
          p_resolver_id: user?.id
        });

      if (updateError) throw updateError;

      // Refresh reports list
      fetchReports();
      Alert.alert('Success', `Report ${action} successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update report';
      console.error('Error updating report:', errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedToday = reports.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.status === 'resolved' && r.updated_at.startsWith(today);
  });

  const filteredReports = reports.filter(report => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        report.note.title.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.user.name.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.status !== 'all' && report.status !== filters.status) return false;
    if (filters.type !== 'all' && report.type !== filters.type) return false;

    if (filters.dateRange !== 'all') {
      const reportDate = new Date(report.created_at);
      const now = new Date();
      switch (filters.dateRange) {
        case 'today':
          if (reportDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          if (reportDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          if (reportDate < monthAgo) return false;
          break;
      }
    }

    return true;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Flag size={24} color={colors.primary} />
        <Text style={styles.headerText}>Content Moderation</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary} />
          {showFilters ? 
            <ChevronUp size={20} color={colors.primary} /> :
            <ChevronDown size={20} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>

      {showFilters && (
        <Card style={styles.filtersCard}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              {['all', 'pending', 'resolved', 'dismissed'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterOption, filters.status === status && styles.filterOptionActive]}
                  onPress={() => setFilters(f => ({ ...f, status: status as FilterOptions['status'] }))}
                >
                  <Text style={[styles.filterOptionText, filters.status === status && styles.filterOptionTextActive]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>
      )}

      <Card style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{stats.pendingReports}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Resolved Today</Text>
          <Text style={styles.statValue}>{stats.resolvedToday}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Dismissed Today</Text>
          <Text style={styles.statValue}>{stats.dismissedToday}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg. Resolution</Text>
          <Text style={styles.statValue}>{stats.averageResolutionTime}h</Text>
        </View>
      </Card>

      {selectedReports.size > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>{selectedReports.size} reports selected</Text>
          <View style={styles.bulkButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleBulkAction('resolved')}
            >
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.actionText, styles.approveText]}>Approve All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleBulkAction('rejected')}
            >
              <XCircle size={20} color={colors.error} />
              <Text style={[styles.actionText, styles.rejectText]}>Reject All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reports ({filteredReports.length})</Text>
        {filteredReports.map((report) => (

          <Card key={report.id} style={{...styles.reportCard, ...(selectedReports.has(report.id) ? styles.selectedCard : {})}}>

            <View style={styles.reportHeader}>
              <TouchableOpacity 
                style={styles.reportType}
                onPress={() => {
                  setSelectedReports(prev => {
                    const next = new Set(prev);
                    if (next.has(report.id)) {
                      next.delete(report.id);
                    } else {
                      next.add(report.id);
                    }
                    return next;
                  });
                }}
              >
                <Flag size={16} color={colors.warning} />
                <Text style={styles.reportTypeText}>{report.notes[0]?.comments}</Text>
              </TouchableOpacity>
              <Text style={styles.reportDate}>{new Date(report.created_at).toLocaleDateString()}</Text>
            </View>

            <View style={styles.reportContent}>
                <Text style={styles.reportTitle}>
                  <Text style={{fontSize: 14, color: colors.textSecondary}}>{report.notes[0]?.title}</Text>
                </Text>
              <Text style={styles.reportReason}>
                Description: {report.description}
              </Text>
              <TouchableOpacity 
                style={styles.viewContentButton}
                onPress={() => {
                  if (report.type === 'user' && report.profiles) {
                    router.push(`/user/${report.profiles.id}`);
                  } else if (report.type === 'note' && report.note_id) {
                    router.push(`/note/${report.note_id}`);
                  }
                }}
              >
                {report.type === 'user' ? 
                  <MessageCircle size={16} color={colors.primary} /> : 
                  <Flag size={16} color={colors.primary} />
                }
                <Text style={styles.viewContentText}>
                  View {report.type === 'user' ? 'Profile' : 'Note'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.reportedBy, 
                report.status === 'resolved' ? styles.resolvedText :
                report.status === 'rejected' ? styles.dismissedText :
                styles.pendingText
              ]}>
                Status: {report.status.toUpperCase()}
              </Text>
            </View>

            {report.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleResolve(report.id, 'resolved')}
                >
                  <CheckCircle size={20} color={colors.success} />
                  <Text style={[styles.actionText, styles.approveText]}>
                    Approve
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleResolve(report.id, 'rejected')}
                >
                  <XCircle size={20} color={colors.error} />
                  <Text style={[styles.actionText, styles.rejectText]}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  filtersCard: {
    marginBottom: 16,
    padding: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  bulkActions: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkActionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  resolvedText: {
    color: colors.success,
  },
  dismissedText: {
    color: colors.error,
  },
  pendingText: {
    color: colors.warning,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  reportCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: colors.warning + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  reportTypeText: {
    fontSize: 13,
    color: colors.warning,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  reportReason: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  reportContent: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  reportedBy: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: colors.success + '10',
  },
  rejectButton: {
    backgroundColor: colors.error + '10',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  approveText: {
    color: colors.success,
  },
  rejectText: {
    color: colors.error,
  },
  viewContentButton: {
    backgroundColor: colors.primary + '10',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  viewContentText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
