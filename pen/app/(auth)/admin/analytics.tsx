import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  UsersIcon, 
  BookIcon, 
  DownloadIcon,
  HeartIcon,
  Share2Icon,
  MessageSquareIcon,
  ClockIcon,
  BarChart2Icon,
  TrendingUpIcon,
  DollarSignIcon,
  CalendarIcon,
  EyeIcon
} from 'lucide-react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

type AnalyticsData = {
  // User Metrics
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  userGrowthRate: number;
  
  // Note Metrics
  totalNotes: number;
  totalNoteViews: number;
  totalNoteDownloads: number;
  totalNoteLikes: number;
  totalNoteShares: number;
  
  // Engagement Metrics
  avgSessionDuration: number;
  avgDailySessions: number;
  totalComments: number;
  totalMessages: number;
  
  // Time Series Data
  userGrowth: Array<{ date: string; count: number }>;
  noteUploads: Array<{ date: string; count: number }>;
  engagementScores: Array<{ date: string; score: number }>;
  
  // Top Content
  topSubjects: Array<{ subject: string; count: number }>;
  topNotes: Array<{ id: string; title: string; views: number }>;
  topUsers: Array<{ id: string; username: string; score: number }>;
};

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics', timeRange],
    queryFn: async () => {
      const startDate = getStartDate(timeRange);
      const endDate = new Date().toISOString().split('T')[0];

      // Get total users and new users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      // Get note statistics
      const { count: totalNotes } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true });

      const { data: notesData } = await supabase
        .from('notes')
        .select('likes, downloads, comments, created_at')
        .limit(1000);

      // Calculate note metrics
      const totalNoteLikes = notesData?.reduce((sum, note) => sum + (note.likes || 0), 0) || 0;
      const totalNoteDownloads = notesData?.reduce((sum, note) => sum + (note.downloads || 0), 0) || 0;
      const totalComments = notesData?.reduce((sum, note) => sum + (note.comments || 0), 0) || 0;

      // Get top subjects
      const { data: subjectsData } = await supabase
        .from('notes')
        .select('subject')
        .not('subject', 'is', null);

      const topSubjects = subjectsData?.reduce((acc, { subject }) => {
        if (!subject) return acc;
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topSubjectsList = Object.entries(topSubjects || {})
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get top notes by likes
      const { data: topNotes } = await supabase
        .from('notes')
        .select('id, title, likes')
        .order('likes', { ascending: false })
        .limit(5);

      // Get top users by note count
      const { data: usersData } = await supabase
        .from('notes')
        .select('uploader_id, profiles!inner(username)')
        .limit(1000);

      const userNoteCounts = usersData?.reduce((acc, { uploader_id, profiles }) => {
        const username = Array.isArray(profiles) && profiles.length > 0 
          ? profiles[0]?.username 
          : 'Unknown';
        acc[uploader_id] = {
          username,
          count: (acc[uploader_id]?.count || 0) + 1
        };
        return acc;
      }, {} as Record<string, { username: string; count: number }>);

      const topUsersList = Object.entries(userNoteCounts || {})
        .map(([id, { username, count }]) => ({
          id,
          username,
          score: count
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Generate time series data
      const userGrowth = await generateMockTimeSeries(startDate, endDate, 'users');
      const noteUploads = await generateMockTimeSeries(startDate, endDate, 'notes');
      const engagementScores = await generateMockTimeSeries(startDate, endDate, 'engagement');

      return {
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.3), // 30% of total users as active
        userGrowthRate: newUsers && totalUsers ? (newUsers / (totalUsers - newUsers)) * 100 : 0,
        
        totalNotes: totalNotes || 0,
        totalNoteViews: totalNoteDownloads * 3, // Estimate 3 views per download
        totalNoteDownloads: totalNoteDownloads,
        totalNoteLikes: totalNoteLikes,
        totalNoteShares: Math.floor(totalNoteDownloads * 0.5), // Estimate 1 share per 2 downloads
        
        avgSessionDuration: 300, // 5 minutes in seconds
        avgDailySessions: 1.5,
        totalComments: totalComments,
        totalMessages: Math.floor((totalUsers || 0) * 0.2), // Estimate 20% of users sent messages
        
        userGrowth: userGrowth.map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          count: item.count
        })),
        
        noteUploads: noteUploads.map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          count: item.count
        })),
        
        engagementScores: engagementScores.map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          score: (item.count / 100) * 5 // Convert to 5-point scale
        })),
        
        topSubjects: topSubjectsList,
        
        topNotes: (topNotes || []).map(note => ({
          id: note.id,
          title: note.title || 'Untitled',
          views: note.likes || 0 // Using likes as a proxy for views
        })),
        
        topUsers: topUsersList
      };
    },
    refetchOnWindowFocus: false
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.timeRangeButtonActive
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive
            ]}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatCard = ({
    title,
    value,
    icon: Icon,
    color = colors.primary,
    showTrend = false,
    trend = 0,
    format = (v: any) => v
  }: {
    title: string;
    value: any;
    icon: React.ElementType;
    color?: string;
    showTrend?: boolean;
    trend?: number;
    format?: (value: any) => string | number;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{format(value)}</Text>
      {showTrend && (
        <View style={[styles.trendBadge, { 
          backgroundColor: trend >= 0 ? colors.success + '20' : colors.error + '20' 
        }]}>
          {trend >= 0 ? (
            <ArrowUpIcon size={14} color={colors.success} />
          ) : (
            <ArrowDownIcon size={14} color={colors.error} />
          )}
          <Text style={[styles.trendText, { 
            color: trend >= 0 ? colors.success : colors.error 
          }]}>
            {Math.abs(trend).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );

  const renderChart = (data: any[], color: string, title: string) => {
    if (!data?.length) return null;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <LineChart
          data={{
            labels: data.map(item => item.date.split('/')[0]),
            datasets: [{
              data: data.map(item => item.count || item.score || 0)
            }]
          }}
          width={350}
          height={200}
          chartConfig={{
            backgroundColor: colors.background,
            backgroundGradientFrom: colors.background,
            backgroundGradientTo: colors.background,
            decimalPlaces: 0,
            color: (opacity = 1) => color,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: color
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Track and analyze user engagement</Text>
      </View>

      {renderTimeRangeSelector()}

      <View style={styles.statsGrid}>
        {renderStatCard({
          title: 'Total Users',
          value: data?.totalUsers || 0,
          icon: UsersIcon,
          color: '#4CAF50',
          showTrend: true,
          trend: data?.userGrowthRate || 0
        })}

        {renderStatCard({
          title: 'Active Users',
          value: data?.activeUsers || 0,
          icon: UsersIcon,
          color: '#2196F3'
        })}

        {renderStatCard({
          title: 'Avg. Session',
          value: data?.avgSessionDuration || 0,
          icon: ClockIcon,
          color: '#FF9800',
          format: (v) => `${Math.floor(v / 60)}m ${Math.round(v % 60)}s`
        })}

        {renderStatCard({
          title: 'Engagement',
          value: data?.engagementScores[0]?.score?.toFixed(1) || 0,
          icon: TrendingUpIcon,
          color: '#9C27B0'
        })}
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard({
          title: 'Notes',
          value: data?.totalNotes || 0,
          icon: BookIcon,
          color: '#3F51B5'
        })}

        {renderStatCard({
          title: 'Views',
          value: data?.totalNoteViews || 0,
          icon: EyeIcon,
          color: '#00BCD4'
        })}

        {renderStatCard({
          title: 'Downloads',
          value: data?.totalNoteDownloads || 0,
          icon: DownloadIcon,
          color: '#FF5722'
        })}

        {renderStatCard({
          title: 'Likes',
          value: data?.totalNoteLikes || 0,
          icon: HeartIcon,
          color: '#E91E63'
        })}
      </View>

      {renderChart(data?.userGrowth || [], '#4CAF50', 'User Growth')}
      {renderChart(data?.noteUploads || [], '#3F51B5', 'Note Uploads')}
      {renderChart(data?.engagementScores || [], '#9C27B0', 'Engagement Score')}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Subjects</Text>
        {data?.topSubjects?.map((subject, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>
              {subject.subject}
            </Text>
            <Text style={styles.listItemCount}>{subject.count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Notes</Text>
        {data?.topNotes?.map((note, index) => (
          <View key={note.id} style={styles.listItem}>
            <Text style={styles.listItemText} numberOfLines={1}>
              {index + 1}. {note.title}
            </Text>
            <Text style={styles.listItemCount}>{note.views} views</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Users</Text>
        {data?.topUsers?.map((user, index) => (
          <View key={user.id} style={styles.listItem}>
            <Text style={styles.listItemText}>
              {index + 1}. {user.username}
            </Text>
            <Text style={styles.listItemCount}>{Math.round(user.score)} pts</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Helper function to get start date based on time range
function getStartDate(range: TimeRange): string {
  const now = new Date();
  const result = new Date(now);
  
  switch (range) {
    case 'week':
      result.setDate(now.getDate() - 7);
      break;
    case 'month':
      result.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      result.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      result.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return result.toISOString().split('T')[0];
}

// Helper function to generate mock time series data for development
async function generateMockTimeSeries(startDate: string, endDate: string, type: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result = [];
  let current = new Date(start);
  
  // Base values for different metrics
  const baseValues = {
    users: { min: 5, max: 20 },
    notes: { min: 2, max: 15 },
    engagement: { min: 30, max: 80 }
  };
  
  const base = baseValues[type as keyof typeof baseValues] || { min: 0, max: 10 };
  
  while (current <= end) {
    // Add some randomness but with an upward trend
    const daysFromStart = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const trend = 1 + (daysFromStart * 0.05); // 5% daily growth
    const randomFactor = 0.8 + Math.random() * 0.4; // Randomness between 0.8 and 1.2
    
    const value = Math.floor(base.min + (base.max - base.min) * Math.random() * trend * randomFactor);
    
    result.push({
      date: current.toISOString().split('T')[0],
      count: Math.max(base.min, value) // Ensure we don't go below min
    });
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  timeRangeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  trendText: {
    marginLeft: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  listItemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
