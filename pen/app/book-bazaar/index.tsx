import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Modal, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Sliders, MapPin, BookOpen, AlertCircle, X, ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBookListings } from '../../hooks/useBookListings';
import { colors } from '../../constants/colors';
import { formatDistanceToNow } from 'date-fns';

type BookCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  subject: string;
  class_level?: string;
  board?: string;
  condition: string;
  created_at: string;
  updated_at: string;
}

interface BookImage {
  url: string;
}

interface Seller {
  id: string;
  avatar_url: string | null;
  full_name: string | null;
  created_at?: string;
}

interface BookListing {
  id: string;
  price: number;
  is_free: boolean;
  is_for_exchange: boolean;
  exchange_details?: string;
  location: string;
  contact_preference: 'whatsapp' | 'phone' | 'in_app';
  contact_phone?: string;
  contact_whatsapp?: string;
  created_at: string;
  updated_at: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  book: Book;
  images: BookImage[];
  seller: Seller;
}

const CONDITIONS: BookCondition[] = ['new', 'like_new', 'good', 'fair', 'poor'];
const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Geography', 'Economics', 'Business', 'Psychology', 'Other'
];

const GRADES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'
];

const BOARDS = [
  'CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB',
  'Delhi University', 'Mumbai University', 'Punjab University', 'Other'
];

export default function BookBazaarScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showExchangeOnly, setShowExchangeOnly] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [authorFilter, setAuthorFilter] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setShowFreeOnly(false);
    setShowExchangeOnly(false);
    setSelectedConditions([]);
    setSelectedSubjects([]);
    setAuthorFilter('');
    setSelectedGrades([]);
    setSelectedBoards([]);
    setLocationFilter('');
  };

  const router = useRouter();
  const { books, loading, error } = useBookListings({ onlyMyAds: false });
  
  // Debug: Log when books data changes
  useEffect(() => {
    console.log('Books data changed:', {
      count: books?.length || 0,
      books: books,
      isLoading: loading,
      error: error?.message
    });
  }, [books, loading, error]);

  // Debug: Log the raw books data
  useEffect(() => {
    console.log('Books data:', books);
    if (books.length > 0) {
      console.log('First book sample:', books[0]);
    }
  }, [books]);

  // Individual filter functions
  const matchesSearch = (book: BookListing) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      book.book?.title?.toLowerCase().includes(query) ||
      book.book?.author?.toLowerCase().includes(query) ||
      (book.book?.subject && book.book.subject.toLowerCase().includes(query))
    );
  };

  const matchesPrice = (book: BookListing) => {
    if (showFreeOnly && book.is_free) return true;
    if (showExchangeOnly && book.is_for_exchange) return true;
    
    const price = book.price || 0;
    const min = priceRange.min ? parseFloat(priceRange.min) : 0;
    const max = priceRange.max ? parseFloat(priceRange.max) : Number.MAX_SAFE_INTEGER;
    
    return price >= min && price <= max;
  };

  const matchesCondition = (book: BookListing) => {
    if (selectedConditions.length === 0) return true;
    return book.condition ? selectedConditions.includes(book.condition) : false;
  };

  const matchesSubject = (book: BookListing) => {
    if (selectedSubjects.length === 0) return true;
    return book.book?.subject ? selectedSubjects.includes(book.book.subject) : false;
  };

  const matchesAuthor = (book: BookListing) => {
    if (!authorFilter) return true;
    return book.book?.author?.toLowerCase().includes(authorFilter.toLowerCase()) || false;
  };

  const matchesGrade = (book: BookListing) => {
    if (selectedGrades.length === 0) return true;
    return book.book?.class_level ? selectedGrades.includes(book.book.class_level) : false;
  };

  const matchesBoard = (book: BookListing) => {
    if (selectedBoards.length === 0) return true;
    return book.book?.board ? selectedBoards.includes(book.book.board) : false;
  };

  const matchesLocation = (book: BookListing) => {
    if (!locationFilter) return true;
    return book.location?.toLowerCase().includes(locationFilter.toLowerCase()) || false;
  };

  const filteredBooks = useMemo(() => {
    if (!books || books.length === 0) {
      console.log('No books to filter');
      return [];
    }
    
    const result = books.filter(book => {
      try {
        return (
          matchesSearch(book) && 
          matchesPrice(book) && 
          matchesCondition(book) && 
          matchesSubject(book) && 
          matchesAuthor(book) && 
          matchesGrade(book) && 
          matchesBoard(book) && 
          matchesLocation(book)
        );
      } catch (err) {
        console.error('Error filtering book:', { book, error: err });
        return false;
      }
    });
    
    return result;
  }, [books, searchQuery, priceRange, selectedConditions, selectedSubjects, authorFilter, selectedGrades, selectedBoards, locationFilter, showFreeOnly, showExchangeOnly]);

  const toggleCondition = (condition: string) => {
    // Convert to lowercase to match database values
    const normalizedCondition = condition.toLowerCase() as BookCondition;
    setSelectedConditions(prev => 
      prev.includes(normalizedCondition) 
        ? prev.filter(c => c !== normalizedCondition)
        : [...prev, normalizedCondition]
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const resetFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedConditions([]);
    setSelectedSubjects([]);
  };

  const formatCondition = (condition: string) => {
    if (!condition) return 'N/A';
    return condition
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace('Like New', 'Like New'); // Special case for 'like_new'
  };

  const activeFilterCount = [
    searchQuery,
    priceRange.min || priceRange.max,
    selectedConditions.length,
    selectedSubjects.length,
    authorFilter,
    selectedGrades.length,
    selectedBoards.length,
    locationFilter
  ].filter(Boolean).length;

  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => router.push(`/book-bazaar/${item.id}`)}
    >
      {item.images?.[0]?.url ? (
        <Image 
          source={{ uri: item.images[0].url }} 
          style={styles.bookImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.bookImagePlaceholder}>
          <BookOpen size={32} color="#5856D6" />
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.book?.title || 'Untitled Book'}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.book?.author || 'Unknown Author'}
        </Text>
        <Text style={styles.bookPrice}>₹{item.price?.toLocaleString()}</Text>
        <View style={styles.bookMeta}>
          <Text style={styles.bookLocation}>
            <MapPin size={12} color="#666" style={{ marginRight: 4 }} />
            {item.location || 'N/A'}
          </Text>
          <Text style={styles.bookCondition}>
            {item.condition ? formatCondition(item.condition) : 'N/A'}
          </Text>
        </View>
        <Text style={styles.postedAgo}>
          {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors?.primary || '#0000ff'} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load books. Please try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for books, authors, subjects..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Sliders size={20} color={activeFilterCount > 0 ? '#fff' : '#5856D6'} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, {marginLeft: 8}]}
            onPress={() => {
              setSearchQuery('');
              setPriceRange({ min: '', max: '' });
              setSelectedConditions([]);
              setSelectedSubjects([]);
              console.log('All filters reset');
            }}
          >
            <Text style={{color: '#fff'}}>Reset All</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.booksContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#5856D6" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No matching books found' : 'No books available yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Check back later for new listings'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              {/* Author Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Author</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Filter by author"
                  value={authorFilter}
                  onChangeText={setAuthorFilter}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter location"
                  value={locationFilter}
                  onChangeText={setLocationFilter}
                  placeholderTextColor="#999"
                />
              </View>
              
              {/* Grade/Class Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  style={styles.dropdownHeader}
                  onPress={() => setShowGradeDropdown(!showGradeDropdown)}
                >
                  <Text style={styles.filterSectionTitle}>
                    Grade/Class {selectedGrades.length > 0 && `(${selectedGrades.length})`}
                  </Text>
                  {showGradeDropdown ? 
                    <ChevronUp size={20} color="#fff" /> : 
                    <ChevronDown size={20} color="#fff" />
                  }
                </TouchableOpacity>
                
                {showGradeDropdown && (
                  <View style={styles.tagsContainer}>
                    {GRADES.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.tag,
                          selectedGrades.includes(grade) && styles.selectedTag
                        ]}
                        onPress={() => {
                          setSelectedGrades(prev =>
                            prev.includes(grade)
                              ? prev.filter(g => g !== grade)
                              : [...prev, grade]
                          );
                        }}
                      >
                        <Text style={[
                          styles.tagText,
                          selectedGrades.includes(grade) && styles.selectedTagText
                        ]}>
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Board/University Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  style={styles.dropdownHeader}
                  onPress={() => setShowBoardDropdown(!showBoardDropdown)}
                >
                  <Text style={styles.filterSectionTitle}>
                    Board/University {selectedBoards.length > 0 && `(${selectedBoards.length})`}
                  </Text>
                  {showBoardDropdown ? 
                    <ChevronUp size={20} color="#fff" /> : 
                    <ChevronDown size={20} color="#fff" />
                  }
                </TouchableOpacity>
                
                {showBoardDropdown && (
                  <View style={styles.tagsContainer}>
                    {BOARDS.map((board) => (
                      <TouchableOpacity
                        key={board}
                        style={[
                          styles.tag,
                          selectedBoards.includes(board) && styles.selectedTag
                        ]}
                        onPress={() => {
                          setSelectedBoards(prev =>
                            prev.includes(board)
                              ? prev.filter(b => b !== board)
                              : [...prev, board]
                          );
                        }}
                      >
                        <Text style={[
                          styles.tagText,
                          selectedBoards.includes(board) && styles.selectedTagText
                        ]}>
                          {board}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  style={styles.dropdownHeader}
                  onPress={() => setShowPriceDropdown(!showPriceDropdown)}
                >
                  <Text style={styles.filterSectionTitle}>
                    Price Range
                    {(showFreeOnly || showExchangeOnly) && ' (Filtered)'}
                  </Text>
                  {showPriceDropdown ? 
                    <ChevronUp size={20} color="#fff" /> : 
                    <ChevronDown size={20} color="#fff" />
                  }
                </TouchableOpacity>
                
                {showPriceDropdown && (
                  <View>
                    <View style={styles.priceOptionsContainer}>
                      <TouchableOpacity
                        style={[styles.priceOption, showFreeOnly && styles.priceOptionActive]}
                        onPress={() => {
                          setShowFreeOnly(!showFreeOnly);
                          if (showExchangeOnly && showFreeOnly) {
                            setShowExchangeOnly(false);
                          }
                        }}
                      >
                        <Text style={[styles.priceOptionText, showFreeOnly && styles.priceOptionTextActive]}>
                          Free
                        </Text>
                        {showFreeOnly && <Check size={16} color="#fff" style={styles.checkIcon} />}
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.priceOption, showExchangeOnly && styles.priceOptionActive]}
                        onPress={() => {
                          setShowExchangeOnly(!showExchangeOnly);
                          if (showFreeOnly && showExchangeOnly) {
                            setShowFreeOnly(false);
                          }
                        }}
                      >
                        <Text style={[styles.priceOptionText, showExchangeOnly && styles.priceOptionTextActive]}>
                          For Exchange
                        </Text>
                        {showExchangeOnly && <Check size={16} color="#fff" style={styles.checkIcon} />}
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.orText}>OR</Text>
                      <View style={styles.priceInputsRow}>
                        <TextInput
                          style={[styles.input, styles.priceInput]}
                          placeholder="Min ₹"
                          value={priceRange.min}
                          onChangeText={(text) => {
                            setPriceRange({ ...priceRange, min: text.replace(/[^0-9]/g, '') });
                            setShowFreeOnly(false);
                            setShowExchangeOnly(false);
                          }}
                          keyboardType="numeric"
                          placeholderTextColor="#999"
                        />
                        <Text style={styles.dash}>-</Text>
                        <TextInput
                          style={[styles.input, styles.priceInput]}
                          placeholder="Max ₹"
                          value={priceRange.max}
                          onChangeText={(text) => {
                            setPriceRange({ ...priceRange, max: text.replace(/[^0-9]/g, '') });
                            setShowFreeOnly(false);
                            setShowExchangeOnly(false);
                          }}
                          keyboardType="numeric"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Condition Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  style={styles.dropdownHeader}
                  onPress={() => setShowConditionDropdown(!showConditionDropdown)}
                >
                  <Text style={styles.filterSectionTitle}>
                    Condition {selectedConditions.length > 0 && `(${selectedConditions.length})`}
                  </Text>
                  {showConditionDropdown ? 
                    <ChevronUp size={20} color="#fff" /> : 
                    <ChevronDown size={20} color="#fff" />
                  }
                </TouchableOpacity>
                
                {showConditionDropdown && (
                  <View style={styles.checkboxContainer}>
                    {CONDITIONS.map(condition => (
                      <TouchableOpacity
                        key={condition}
                        style={styles.checkboxItem}
                        onPress={() => toggleCondition(condition)}
                      >
                        <View style={[
                          styles.checkbox,
                          selectedConditions.includes(condition) && styles.checkboxSelected
                        ]}>
                          {selectedConditions.includes(condition) && <Check size={14} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>
                          {condition.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Subject Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  style={styles.dropdownHeader}
                  onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                >
                  <Text style={styles.filterSectionTitle}>
                    Subject {selectedSubjects.length > 0 && `(${selectedSubjects.length})`}
                  </Text>
                  {showSubjectDropdown ? 
                    <ChevronUp size={20} color="#fff" /> : 
                    <ChevronDown size={20} color="#fff" />
                  }
                </TouchableOpacity>
                
                {showSubjectDropdown && (
                  <View style={styles.tagsContainer}>
                    {SUBJECTS.map(subject => (
                      <TouchableOpacity
                        key={subject}
                        style={[
                          styles.tag,
                          selectedSubjects.includes(subject) && styles.selectedTag,
                        ]}
                        onPress={() => toggleSubject(subject)}
                      >
                        <Text style={[
                          styles.tagText,
                          selectedSubjects.includes(subject) && styles.selectedTagText,
                        ]}>
                          {subject}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.filterButton, styles.resetButton]}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, styles.applyButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Show {filteredBooks.length} Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Book card styles
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  bookImage: {
    width: 100,
    height: 140,
    backgroundColor: '#f5f5f5',
  },
  bookImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    padding: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bookLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 12,
    color: '#666',
  },
  bookCondition: {
    fontSize: 12,
    color: '#666',
  },
  postedAgo: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  // Search and filter
  searchContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Book list
  booksContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTagText: {
    color: '#fff',
  },
  // Price range
  priceRangeContainer: {
    marginTop: 8,
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  priceInput: {
    flex: 1,
    minWidth: 0, // Prevents flex items from overflowing
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  // Apply button
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Container
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    backgroundColor: '#2a1a3d',  // Dark purple background
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  priceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1a35',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4a2d5b',
  },
  priceOptionActive: {
    backgroundColor: '#8a4dff',
    borderColor: '#8a4dff',
  },
  priceOptionText: {
    marginLeft: 6,
    color: '#e0c8ff',
    fontSize: 14,
  },
  priceOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  orText: {
    marginVertical: 8,
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
  checkIcon: {
    marginLeft: 4,
  },
  dash: {
    marginHorizontal: 8,
    fontSize: 18,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#2a1a3d',  // Dark purple background
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4a2d7a',  // Light purple border
  },
  selectedTag: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 14,
    color: '#fff',
  },
  selectedTagText: {
    color: '#fff',
  },
  tagsContainer: {
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000000',
  },
  errorText: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
  },
  searchIcon: {
    marginRight: 8,
    color: '#5856D6',
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 15,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#5856D6',
    borderRadius: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  booksContainer: {
    padding: 16,
    paddingTop: 8,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookImage: {
    width: 100,
    height: 140,
    backgroundColor: '#2a2a4a',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  bookImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    padding: 14,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#b8b8ff',
    marginBottom: 8,
  },
  bookPrice: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 13,
    color: '#a0a0ff',
  },
  bookCondition: {
    fontSize: 12,
    color: '#888',
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInputContainer: {
    width: '100%',
    marginTop: 12,
  },
  priceInputLabel: {
    color: '#888',
    marginBottom: 6,
    fontSize: 14,
  },
  priceInput: {
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxContainer: {
    marginTop: 8,
    paddingLeft: 4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#5856D6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#5856D6',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#5856D6',
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#5856D6',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  postedAgo: {
    fontSize: 12,
    color: '#a0a0ff',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#b8b8ff',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
