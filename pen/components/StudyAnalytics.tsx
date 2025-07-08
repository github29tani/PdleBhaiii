import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import StudyAssistant from '@/lib/ai/studyAssistant';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

type StudySession = {
  id: string;
  subject: string;
  duration: number;
  date: string;
  rating: number;
  notes: string;
};

type AnalyticsData = {
  totalHours: number;
  averageSession: number;
  subjects: {
    name: string;
    hours: number;
    color: string;
  }[];
  weeklyProgress: {
    day: string;
    hours: number;
  }[];
  aiInsights: string[];
};

const StudyAnalytics = () => {
  const { user } = useAuthStore();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch study sessions from Supabase
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Process data for analytics
      const processedData = processSessions(sessions || []);
      
      // Get AI insights
      const aiInsights = await StudyAssistant.getStudyRecommendations(user?.id);

      setAnalyticsData({
        ...processedData,
        aiInsights,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const processSessions = (sessions: StudySession[]) => {
    if (sessions.length === 0) {
      return {
        totalHours: 0,
        averageSession: 0,
        subjects: [],
        weeklyProgress: [],
      };
    }

    // Calculate total hours
    const totalHours = sessions.reduce((sum, session) => sum + session.duration, 0) / 60;
    
    // Calculate average session length
    const averageSession = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length;
    
    // Get subject distribution
    const subjectMap = new Map<string, number>();
    sessions.forEach(session => {
      const subject = session.subject || 'Uncategorized';
      subjectMap.set(subject, (subjectMap.get(subject) || 0) + session.duration);
    });

    const subjects = Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, hours], index) => ({
        name,
        hours: hours / 60,
        color: [
          '#008ECC',
          '#4CB4E0',
          '#6C5CE7',
          '#AFEEEE',
          '#FF6B6B',
        ][index % 5],
      }));

    // Get weekly progress
    const weeklyProgress = Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return (
          sessionDate.getDate() === date.getDate() &&
          sessionDate.getMonth() === date.getMonth() &&
          sessionDate.getFullYear() === date.getFullYear()
        );
      });
      return {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        hours: daySessions.reduce((sum, s) => sum + s.duration, 0) / 60,
      };
    });

    return {
      totalHours,
      averageSession,
      subjects,
      weeklyProgress,
    };
  };

  const renderSubjectPieChart = () => {
    if (!analyticsData?.subjects.length) return null;

    const data = {
      labels: analyticsData.subjects.map(s => s.name),
      data: analyticsData.subjects.map(s => s.hours),
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Subject Distribution</Text>
        <PieChart
          data={data}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: colors.background,
            backgroundGradientFrom: colors.background,
            backgroundGradientTo: colors.background,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="data"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
        <View style={styles.legendContainer}>
          {analyticsData.subjects.map((subject, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: subject.color }]} />
              <Text style={styles.legendText}>
                {subject.name}: {subject.hours.toFixed(1)}h
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWeeklyProgress = () => {
    if (!analyticsData?.weeklyProgress.length) return null;

    const data = {
      labels: analyticsData.weeklyProgress.map(p => p.day),
      datasets: [
        {
          data: analyticsData.weeklyProgress.map(p => p.hours),
          color: (opacity = 1) => colors.primary,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Progress</Text>
        <LineChart
          data={data}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: colors.background,
            backgroundGradientFrom: colors.background,
            backgroundGradientTo: colors.background,
            decimalPlaces: 1,
            color: (opacity = 1) => colors.primary,
            labelColor: (opacity = 1) => colors.text,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: colors.primary,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    );
  };

  const renderAIInsights = () => {
    if (!analyticsData?.aiInsights?.length) return null;

    return (
      <View style={styles.aiInsightsContainer}>
        <Text style={styles.sectionTitle}>AI Insights</Text>
        {analyticsData.aiInsights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="robot-happy" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Analytics</Text>
        <TouchableOpacity 
          style={styles.timeRangeButton}
          onPress={() => {
            const ranges = ['week', 'month', 'year'];
            const currentIndex = ranges.indexOf(selectedTimeRange);
            setSelectedTimeRange(ranges[(currentIndex + 1) % ranges.length]);
          }}
        >
          <Text style={styles.timeRangeText}>
            Last {selectedTimeRange === 'week' ? 'Week' : 
                   selectedTimeRange === 'month' ? 'Month' : 'Year'}
          </Text>
          <MaterialCommunityIcons 
            name="calendar" 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Study Time</Text>
              <Text style={styles.statValue}>{analyticsData?.totalHours.toFixed(1)}h</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average Session</Text>
              <Text style={styles.statValue}>{analyticsData?.averageSession.toFixed(1)}m</Text>
            </View>
          </View>

          {renderSubjectPieChart()}
          {renderWeeklyProgress()}
          {renderAIInsights()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeRangeText: {
    color: colors.primary,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
  },
  aiInsightsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  insightText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
});

export default StudyAnalytics;
