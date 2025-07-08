import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, FlatList, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

type TimeRange = 'today' | 'week' | 'month' | 'all';
type ContentType = 'trending' | 'recommended' | 'featured';

interface Note {
  id: string;
  title: string;
  subject: string;
  likes: number;
  downloads: number;
  views: number;
  created_at: string;
  is_featured?: boolean;
  is_trending?: boolean;
}

export default function ContentDiscovery() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [contentType, setContentType] = useState<ContentType>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch trending notes
  const { data: trendingNotes, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['admin', 'trending-notes', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('likes', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Note[];
    },
  });

  // Fetch recommended notes (based on user behavior)
  const { data: recommendedNotes, isLoading: isLoadingRecommended } = useQuery({
    queryKey: ['admin', 'recommended-notes'],
    queryFn: async () => {
      // This would be replaced with actual recommendation logic
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('downloads', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Note[];
    },
  });

  // Toggle featured status
  const toggleFeatured = useMutation({
    mutationFn: async ({ noteId, isFeatured }: { noteId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from('notes')
        .update({ is_featured: isFeatured })
        .eq('id', noteId);
      
      if (error) throw error;
      return { noteId, isFeatured };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trending-notes'] });
    },
  });

  // Toggle trending status
  const toggleTrending = useMutation({
    mutationFn: async ({ noteId, isTrending }: { noteId: string; isTrending: boolean }) => {
      const { error } = await supabase
        .from('notes')
        .update({ is_trending: isTrending })
        .eq('id', noteId);
      
      if (error) throw error;
      return { noteId, isTrending };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trending-notes'] });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['admin'] });
    setIsRefreshing(false);
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.noteMeta}>
          <Text style={styles.noteSubject}>{item.subject}</Text>
          <View style={styles.noteStats}>
            <Ionicons name="heart" size={14} color={colors.primary} />
            <Text style={styles.statText}>{item.likes || 0}</Text>
            <Ionicons name="download" size={14} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statText}>{item.downloads || 0}</Text>
          </View>
        </View>
      </View>
      <View style={styles.noteActions}>
        <TouchableOpacity 
          style={[styles.actionButton, item.is_featured && styles.activeButton]}
          onPress={() => toggleFeatured.mutate({ noteId: item.id, isFeatured: !item.is_featured })}
        >
          <Ionicons 
            name={item.is_featured ? "star" : "star-outline"} 
            size={18} 
            color={item.is_featured ? colors.primary : colors.text} 
          />
          <Text style={styles.buttonText}>{item.is_featured ? 'Featured' : 'Feature'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, item.is_trending && styles.activeButton]}
          onPress={() => toggleTrending.mutate({ noteId: item.id, isTrending: !item.is_trending })}
        >
          <Ionicons 
            name={item.is_trending ? "trending-up" : "trending-up-outline"} 
            size={18} 
            color={item.is_trending ? colors.primary : colors.text} 
          />
          <Text style={styles.buttonText}>{item.is_trending ? 'Trending' : 'Trend'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (isLoadingTrending || isLoadingRecommended) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const notes = contentType === 'trending' ? trendingNotes : recommendedNotes;
    
    return (
      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Content Discovery</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, contentType === 'trending' && styles.activeTab]}
          onPress={() => setContentType('trending')}
        >
          <Ionicons 
            name="trending-up" 
            size={20} 
            color={contentType === 'trending' ? colors.primary : colors.text} 
          />
          <Text style={[styles.tabText, contentType === 'trending' && styles.activeTabText]}>
            Trending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, contentType === 'recommended' && styles.activeTab]}
          onPress={() => setContentType('recommended')}
        >
          <Ionicons 
            name="thumbs-up" 
            size={20} 
            color={contentType === 'recommended' ? colors.primary : colors.text} 
          />
          <Text style={[styles.tabText, contentType === 'recommended' && styles.activeTabText]}>
            Recommended
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeRangeTabs}>
        {(['today', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.timeRangeTab, timeRange === range && styles.activeTimeRangeTab]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeRangeText, timeRange === range && styles.activeTimeRangeText]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
  },
  tabText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  timeRangeTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
  },
  timeRangeTab: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
  },
  activeTimeRangeTab: {
    backgroundColor: colors.primary + '20',
  },
  timeRangeText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  activeTimeRangeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  noteCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteSubject: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  noteStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginLeft: 12,
  },
  statText: {
    marginLeft: 4,
    color: colors.textSecondary,
    fontSize: 12,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
    marginHorizontal: 4,
  },
  activeButton: {
    backgroundColor: colors.primary + '20',
  },
  buttonText: {
    marginLeft: 6,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
});
