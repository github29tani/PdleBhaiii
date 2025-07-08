import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Image, 
  RefreshControl, 
  TextInput,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  BookOpen, 
  Check, 
  X, 
  Search, 
  Trash2, 
  Eye, 
  Sliders,
  ChevronDown, 
  ChevronRight,
  Filter,
  AlertCircle,
  Shield
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';

type BookListing = {
  id: string;
  created_at: string;
  book: {
    title: string;
    author: string;
  };
  price_inr: number;
  is_active: boolean;
  is_sold: boolean;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  seller: {
    id: string;
    name: string | null;
  };
  images: { url: string }[];
};

const conditionLabels = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export default function AdminBookBazaar() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('book_listings')
        .select(`
          *,
          book:books(*),
          images:book_images(url),
          seller:seller_id!inner(id, name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter === 'active') {
        query = query.eq('is_active', true).eq('is_sold', false);
      } else if (filter === 'sold') {
        query = query.eq('is_sold', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Apply search
      if (search) {
        query = query.or(`book.title.ilike.%${search}%,book.author.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Failed to fetch book listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const toggleListingStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('book_listings')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setListings(listings.map(listing => 
        listing.id === id ? { ...listing, is_active: !currentStatus } : listing
      ));
      
      Alert.alert('Success', `Listing ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating listing status:', error);
      Alert.alert('Error', 'Failed to update listing status');
    }
  };

  const deleteListing = async (id: string) => {
    try {
      const { error } = await supabase
        .from('book_listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setListings(listings.filter(listing => listing.id !== id));
      
      Alert.alert('Success', 'Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      Alert.alert('Error', 'Failed to delete listing');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteListing(id) },
      ]
    );
  };

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const renderListing = ({ item }: { item: BookListing }) => (
    <Card style={styles.listingCard}>
      <View style={styles.listingContent}>
        <View style={styles.listingInfo}>
          <View style={styles.listingHeader}>
            <Text style={styles.listingTitle} numberOfLines={2}>{item.book.title}</Text>
            <View style={[
              styles.statusBadge,
              item.is_sold 
                ? styles.statusSold 
                : item.is_active 
                  ? styles.statusActive 
                  : styles.statusInactive
            ]}>
              <Text style={styles.statusBadgeText}>
                {item.is_sold ? 'Sold' : item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Text style={styles.listingAuthor} numberOfLines={1}>by {item.book.author}</Text>
          <Text style={styles.listingDetails}>
            Condition: <Text style={styles.detailValue}>{conditionLabels[item.condition]}</Text>
          </Text>
          <Text style={styles.listingDetails}>
            Seller: <Text style={styles.detailValue}>{item.seller.name || 'Anonymous'}</Text>
          </Text>
          <Text style={styles.listingDetails}>
            Listed: <Text style={styles.detailValue}>
              {format(new Date(item.created_at), 'MMM d, yyyy')}
            </Text>
          </Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{item.price_inr.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => router.push(`/book-bazaar/${item.id}`)}
        >
          <Eye size={16} color="white" />
          <Text style={[styles.actionButtonText, { color: 'white' }]}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => toggleListingStatus(item.id, item.is_active)}
        >
          {item.is_active ? (
            <X size={16} color="white" />
          ) : (
            <Check size={16} color={colors.success} />
          )}
          <Text style={[
            styles.actionButtonText, 
            { 
              color: 'white',
              marginLeft: 4
            }
          ]}>
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => confirmDelete(item.id)}
        >
          <Trash2 size={16} color="white" />
          <Text style={[styles.actionButtonText, { color: 'white', marginLeft: 4 }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Bazaar Management</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={colors.gray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title or author..."
                placeholderTextColor={colors.gray}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={fetchListings}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearch('');
                  fetchListings();
                }} style={styles.clearIcon}>
                  <X size={16} color={colors.gray} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Sliders size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filter by Status</Text>
            <View style={styles.filterOptions}>
              {[
                { value: 'all', label: 'All Listings' },
                { value: 'active', label: 'Active' },
                { value: 'sold', label: 'Sold' },
                { value: 'inactive', label: 'Inactive' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    filter === option.value && styles.filterOptionActive
                  ]}
                  onPress={() => {
                    setFilter(option.value as any);
                    setShowFilters(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filter === option.value && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {filter === option.value && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={colors.gray} />
          <Text style={styles.emptyText}>No listings found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters or search term</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  listingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listingInfo: {
    flex: 1,
    marginRight: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusInactive: {
    backgroundColor: '#F5F3FF',
  },
  statusSold: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  listingAuthor: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  listingDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
  },
  viewButton: {
    backgroundColor: '#8B5CF6',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  toggleButton: {
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: '#8B5CF6',
    flex: 1,
    minWidth: 100,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: '#8B5CF6',
    flex: 1,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  filterModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  filterCheck: {
    marginLeft: 'auto',
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
