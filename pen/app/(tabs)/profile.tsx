import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform, Animated, StyleProp, ViewStyle, Modal, TextInput, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useNotesStore } from '@/store/notes-store';
import { useFollowingStore } from '@/store/followers-store';
import { useEarningsStore } from '@/store/earnings-store';
import { useBookCount } from '@/hooks/useBookCount';
import { EditProfileModal } from '@/components/EditProfileModal';
import { InterestsModal } from '@/components/InterestsModal';
import { LogOut, Upload, DollarSign, Award, Settings, ChevronRight, Edit2, User, Mail, Calendar, MapPin, Link as LinkIcon, Check, X, Lock, Unlock, UserPlus, Users, BookOpen, Bookmark, UserX, BarChart2, MoreVertical, Camera, Plus, Briefcase, Bell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { NoteCard } from '@/components/NoteCard';
import { EmptyState } from '@/components/EmptyState';
import { Twitter, Linkedin, Instagram, Github, Globe } from 'lucide-react-native';
import type { UserProfile } from '@/types';
import Logo from '@/components/Logo';

// Polyfill Alert.prompt for web platforms where it's not available
if (Platform.OS === 'web' && !(Alert as any).prompt) {
  (Alert as any).prompt = (
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | any,
    _type?: any
  ) => {
    const text = window.prompt(`${title}\n${message ?? ''}`);
    if (text !== null && typeof callbackOrButtons === 'function') {
      callbackOrButtons(text);
    }
  };
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const goToNotifications = () => {
    router.push('/notifications');
  };
  const { user, isAuthenticated, logout, updateProfile, setInterests, setSubjects } = useAuthStore();
  const { uploadedNotes, fetchUploadedNotes } = useNotesStore();
  const { count: booksCount } = useBookCount();
  
  const { followers, following, getFollowers, getFollowing } = useFollowingStore();
  const { earnings, fetchEarnings } = useEarningsStore();
  
  const navigateToStats = () => {
    router.push('/stats');
  };
  
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editLinkedIn, setEditLinkedIn] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editGitHub, setEditGitHub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editQualifications, setEditQualifications] = useState<Array<{id: string, qualification: string}>>([]);
  const [editExperience, setEditExperience] = useState<Array<{id: string, experience: string}>>([]);
  const [isInterestsModalVisible, setIsInterestsModalVisible] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const bannerAnimation = useState(new Animated.Value(-50))[0];

  // Prompt modal state (web only)
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [promptConfig, setPromptConfig] = useState<{ title: string; message: string; placeholder: string; onSubmit: (text: string) => void }>({
    title: '',
    message: '',
    placeholder: '',
    onSubmit: () => {},
  });

  // Check network connectivity
  const checkNetworkStatus = useCallback(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const wasOffline = isOffline;
    const isNowOffline = !isOnline;
    
    if (isNowOffline !== wasOffline) {
      setIsOffline(isNowOffline);
      
      Animated.spring(bannerAnimation, {
        toValue: isNowOffline ? 0 : -50,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, bannerAnimation]);

  // Set up network info listener
  useEffect(() => {
    checkNetworkStatus();
    
    // Add event listeners for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', checkNetworkStatus);
      window.addEventListener('offline', checkNetworkStatus);
    }
    
    // Check network status every 5 seconds
    const interval = setInterval(checkNetworkStatus, 5000);
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', checkNetworkStatus);
        window.removeEventListener('offline', checkNetworkStatus);
      }
      clearInterval(interval);
    };
  }, [checkNetworkStatus]);

  const fetchProfileData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Fetch qualifications
      const { data: qualificationsData, error: qualError } = await supabase
        .from('user_qualifications')
        .select('qualification')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (qualError) throw qualError;
      
      // Fetch experience
      const { data: experienceData, error: expError } = await supabase
        .from('user_experience')
        .select('experience')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (expError) throw expError;
      
      // Combine all data
      const combinedData = {
        ...profileData,
        qualifications: qualificationsData?.map(q => q.qualification) || [],
        experience: experienceData?.map(e => e.experience) || []
      };
      
      console.log('Fetched profile data:', combinedData);
      return combinedData;
    } catch (error) {
      console.error('Error fetching profile data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        if (id) {
          console.log('Fetching profile for id:', id);
          const profileData = await fetchProfileData(id);
          setProfile(profileData);
        } else if (user?.id) {
          console.log('Using current user profile:', user.id);
          const profileData = await fetchProfileData(user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, user]);

  useEffect(() => {
    // Only load data if authenticated
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditBio(profile.bio || '');
      setEditTwitter(profile.twitter_url || '');
      setEditLinkedIn(profile.linkedin_url || '');
      setEditInstagram(profile.instagram_url || '');
      setEditGitHub(profile.github_url || '');
      setEditWebsite(profile.website_url || '');
      setEditQualifications(profile.qualifications || []);
      setEditExperience(profile.experience || []);
    }
  }, [profile]);
  
  const showPrompt = (
    title: string,
    message: string,
    placeholder: string,
    onSubmit: (text: string) => void,
  ) => {
    if (Platform.OS === 'web') {
      setPromptConfig({ title, message, placeholder, onSubmit });
      setPromptInput('');
      setPromptVisible(true);
    } else {
      Alert.prompt(title, message, (text) => {
        if (text && text.trim()) {
          onSubmit(text.trim());
        }
      }, 'plain-text', undefined, placeholder);
    }
  };

  const handleAddQualification = async () => {
    showPrompt(
      'Add Qualification',
      'Enter your qualification (e.g., B.Sc. Computer Science)',
      'Your qualification',
      async (text) => {
        if (text && text.trim() && user?.id) {
          try {
            const { error } = await supabase
              .from('user_qualifications')
              .insert([{ user_id: user.id, qualification: text.trim() }]);
            
            if (error) throw error;
            
            // Refresh qualifications
            const { data } = await supabase
              .from('user_qualifications')
              .select('qualification')
              .eq('user_id', user.id);
              
            setEditQualifications(data?.map(q => q.qualification) || []);
          } catch (error) {
            console.error('Error adding qualification:', error);
            Alert.alert('Error', 'Failed to add qualification');
          }
        }
      },
      'plain-text'
    );
  };
  
  const handleAddExperience = async () => {
    showPrompt(
      'Add Experience',
      'Describe your experience (e.g., 2 years teaching Math)',
      'Your experience',
      async (text) => {
        if (text && text.trim() && user?.id) {
          try {
            const { error } = await supabase
              .from('user_experience')
              .insert([{ user_id: user.id, experience: text.trim() }]);
            
            if (error) throw error;
            
            // Refresh experience
            const { data } = await supabase
              .from('user_experience')
              .select('experience')
              .eq('user_id', user.id);
              
            setEditExperience(data?.map(e => e.experience) || []);
          } catch (error) {
            console.error('Error adding experience:', error);
            Alert.alert('Error', 'Failed to add experience');
          }
        }
      },
      'plain-text'
    );
  };
  
  const handleRemoveQualification = async (index: number) => {
    if (!user?.id || !editQualifications?.[index]) return;
    
    try {
      const { error } = await supabase
        .from('user_qualifications')
        .delete()
        .eq('user_id', user.id)
        .eq('qualification', editQualifications[index]);
        
      if (error) throw error;
      
      // Update local state
      const newQualifications = [...(editQualifications || [])];
      newQualifications.splice(index, 1);
      setEditQualifications(newQualifications);
    } catch (error) {
      console.error('Error removing qualification:', error);
      Alert.alert('Error', 'Failed to remove qualification');
    }
  };
  
  const handleRemoveExperience = async (index: number) => {
    if (!user?.id || !editExperience?.[index]) return;
    
    try {
      const { error } = await supabase
        .from('user_experience')
        .delete()
        .eq('user_id', user.id)
        .eq('experience', editExperience[index]);
        
      if (error) throw error;
      
      // Update local state
      const newExperience = [...(editExperience || [])];
      newExperience.splice(index, 1);
      setEditExperience(newExperience);
    } catch (error) {
      console.error('Error removing experience:', error);
      Alert.alert('Error', 'Failed to remove experience');
    }
  };

  useEffect(() => {
    console.log('User data:', user);
  }, [user]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && user) {
        loadData();
      }
    }, [isAuthenticated, user])
  );
  
  const loadData = async () => {
    if (profile) {
      console.log('Loading data for user:', profile.id);
      await Promise.all([
        fetchUploadedNotes(profile.id),
        fetchEarnings(),
        getFollowers(profile.id),
        getFollowing(profile.id)
      ]);
      console.log('Current following:', following);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const handleLogout = () => {
    logout();
    // No need to navigate - the tab navigator will handle this
  };
  
  const handleManualRefresh = () => {
    Alert.alert(
      "Refresh Data",
      "Do you want to refresh your profile data?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Refresh",
          onPress: loadData
        }
      ]
    );
  };
  
  const handleUpdateInterests = async (interests: string[], subjects: string[]) => {
    try {
      await Promise.all([
        await setInterests(interests),
        await setSubjects(subjects)
      ]);
      // Refresh data after updating interests
      await loadData();
    } catch (error) {
      console.error('Failed to update interests:', error);
      Alert.alert('Error', 'Failed to update interests. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    try {
      // Update the profile information
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          bio: editBio,
          twitter_url: editTwitter || null,
          linkedin_url: editLinkedIn || null,
          instagram_url: editInstagram || null,
          github_url: editGitHub || null,
          website_url: editWebsite || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh the profile data
      const updatedProfile = await fetchProfileData(user.id);
      setProfile(updatedProfile);
      
      // Update the auth store with basic profile info
      await updateProfile({
        name: editName,
        bio: editBio,
        twitter_url: editTwitter || undefined,
        linkedin_url: editLinkedIn || undefined,
        instagram_url: editInstagram || undefined,
        github_url: editGitHub || undefined,
        website_url: editWebsite || undefined
      });
      
      // Close the modal and show success
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };
  

  
  const handleReport = async (type: 'user' | 'note', reason: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          user_id: user?.id,
          reported_id: id,
          type,
          reason
        });

      if (error) throw error;
      Alert.alert('Success', 'Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  const showReportOptions = () => {
    Alert.alert(
      'Report Options',
      'What would you like to report?',
      [
        {
          text: 'Report User',
          onPress: () => {
            Alert.alert(
              'Report User',
              'Why are you reporting this user?',
              [
                { text: 'Spam', onPress: () => handleReport('user', 'Spam') },
                { text: 'Fake Account', onPress: () => handleReport('user', 'Fake account') },
                { text: 'Inappropriate Content', onPress: () => handleReport('user', 'Inappropriate content') },
                { text: 'Harassment', onPress: () => handleReport('user', 'Harassment') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        },
        {
          text: 'Report Notes',
          onPress: () => {
            Alert.alert(
              'Report Notes',
              'Why are you reporting these notes?',
              [
                { text: 'Copyright Violation', onPress: () => handleReport('note', 'Copyright violation') },
                { text: 'Inappropriate Content', onPress: () => handleReport('note', 'Inappropriate content') },
                { text: 'Spam', onPress: () => handleReport('note', 'Spam') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const addQualification = () => {
    Alert.prompt(
      'Add Qualification',
      'Enter your qualification (e.g., B.Tech in Computer Science)',
      (text) => {
        if (text && text.trim()) {
          setEditQualifications([...editQualifications, text.trim()]);
        }
      }
    );
  };

  const addExperience = () => {
    Alert.prompt(
      'Add Experience',
      'Describe your experience (e.g., 2+ years teaching Math)',
      (text) => {
        if (text && text.trim()) {
          setEditExperience([...editExperience, text.trim()]);
        }
      }
    );
  };

  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  // Debug logs
  useEffect(() => {
    console.log('Current id param:', id);
    console.log('Current user:', user?.id);
    console.log('Is showing more button:', id && id !== user?.id);
  }, [id, user]);

  // If not authenticated, show login prompt instead of redirecting
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.authPromptContainer}>
          <EmptyState
            title="Your Profile"
            description="Log in to access your profile, uploads, and earnings"
            icon={<User size={40} color={colors.textTertiary} />}
            actionLabel="Log In"
            onAction={() => router.push('/(auth)/login')}
            style={styles.emptyState}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  // Offline banner component
  const OfflineBanner = () => {
    const bannerStyle = {
      ...styles.offlineBanner,
      transform: [{ translateY: bannerAnimation }]
    };
    
    return (
      <Animated.View style={bannerStyle}>
        <Text style={styles.offlineText}>No Internet Connection</Text>
      </Animated.View>
    );
  };

  // Dynamic padding for scroll view based on offline status
  const scrollViewStyle = [
    styles.scrollView,
    isOffline && styles.offlineScrollView
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isOffline && <OfflineBanner />}

      {/* Prompt Modal for web */}
      {Platform.OS === 'web' && (
        <Modal
          visible={promptVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPromptVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{promptConfig.title}</Text>
              <Text style={styles.modalMessage}>{promptConfig.message}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={promptConfig.placeholder}
                placeholderTextColor="#9CA3AF"
                value={promptInput}
                onChangeText={setPromptInput}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setPromptVisible(false)} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (promptInput.trim()) {
                      promptConfig.onSubmit(promptInput.trim());
                    }
                    setPromptVisible(false);
                  }}
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <View style={styles.headerActions}>
          {/* Notification button */}
          {!id && (
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={goToNotifications}
            >
              <Bell size={16} color={colors.primary} />
              <Text style={styles.notificationText}>Notifications</Text>
            </TouchableOpacity>
          )}
          {/* Only show logout for own profile */}
          {!id && (
            <TouchableOpacity 
              style={[styles.logoutButton, { marginLeft: 'auto' }]}
              onPress={handleLogout}
            >
              <LogOut size={16} color={colors.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Show report button for other profiles */}
        {id && id !== user?.id && (
          <TouchableOpacity 
            style={[styles.moreButton, { right: 20 }]}
            onPress={showReportOptions}
          >
            <MoreVertical size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView 
        style={scrollViewStyle}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.coverPhoto}>
            <View style={styles.coverGradient} />
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <User size={50} color="#FFFFFF" />
                </View>
              )}
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={() => setIsEditModalVisible(true)}
              >
                <Camera size={16} color="#FFFFFF" style={{ opacity: 0.8 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileContent}>
              <View style={styles.nameSection}>
                <TouchableOpacity 
                  style={styles.nameButton}
                  onPress={() => setIsEditModalVisible(true)}
                >
                  <Text style={styles.displayName}>{profile?.name}</Text>
                  <Edit2 size={16} color={colors.primary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
                <Text style={[styles.username, { color: colors.primary }]}>@{profile?.username}</Text>
                <TouchableOpacity 
                  style={styles.bioButton}
                  onPress={() => setIsEditModalVisible(true)}
                >
                  <View style={styles.bioHeader}>
                    <View style={styles.bioLabelContainer}>
                      <Text style={styles.bioLabel}>About Me</Text>
                      {profile?.bio ? (
                        <View style={styles.bioLengthIndicator}>
                          <Text style={styles.bioLengthText}>{profile.bio.length}/500</Text>
                        </View>
                      ) : null}
                    </View>
                    <Edit2 size={16} color={colors.primary} />
                  </View>
                  {profile?.bio ? (
                    <View style={styles.bioContent}>
                      <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
                      <View style={styles.bioFooter}>
                        <TouchableOpacity 
                          style={styles.readMoreButton}
                          onPress={() => setIsEditModalVisible(true)}
                        >
                          <Text style={styles.readMoreText}>Read more</Text>
                          <ChevronRight size={14} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyBioContent}>
                      <Text style={[styles.bio, styles.emptyBioText]}>Share something about yourself...</Text>
                      <View style={styles.addBioButton}>
                        <Text style={styles.addBioText}>Add Bio</Text>
                        <Plus size={14} color={colors.primary} />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{followers.length}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{following.length}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{uploadedNotes.length}</Text>
                <Text style={styles.statLabel}>Notes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{booksCount}</Text>
                <Text style={styles.statLabel}>Books</Text>
              </View>
            </View>


            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => setIsInterestsModalVisible(true)}
              >
                <View style={styles.menuHeader}>
                  <View style={[styles.menuIconContainer, { backgroundColor: colors.primary }]}>
                    <BookOpen size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>Interests</Text>
                    <Text style={styles.menuSubtext}>
                      {profile?.interests?.length || 0} subjects selected
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/stats')}
              >
                <View style={styles.menuHeader}>
                  <View style={[styles.menuIconContainer, { backgroundColor: '#4F46E5' }]}>
                    <BarChart2 size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>View Detailed Stats</Text>
                    <Text style={styles.menuSubtext}>
                      See your reading statistics and insights
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push(`/followers/${profile?.id}`)}
              >
                <View style={styles.menuHeader}>
                  <View style={[styles.menuIconContainer, { backgroundColor: colors.info }]}>
                    <Users size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>Followers</Text>
                    <Text style={styles.menuSubtext}>{followers.length} people follow you</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push(`/following/${profile?.id}`)}
              >
                <View style={styles.menuHeader}>
                  <View style={[styles.menuIconContainer, { backgroundColor: colors.info }]}>
                    <UserPlus size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>Following</Text>
                    <Text style={styles.menuSubtext}>You follow {following.length} people</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {profile?.is_verified && (
                <TouchableOpacity style={styles.menuCard}>
                  <View style={styles.menuHeader}>
                    <View style={[styles.menuIconContainer, { backgroundColor: colors.warning }]}>
                      <Award size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuTitle}>Verified Creator</Text>
                  </View>
                  <Text style={styles.menuSubtext}>{profile.verification_reason || 'Trusted content creator'}</Text>
                </TouchableOpacity>
              )}

              {profile?.is_admin && (
                <TouchableOpacity 
                  style={styles.menuCard}
                  onPress={() => router.push('/admin')}
                >
                  <View style={styles.menuHeader}>
                    <View style={[styles.menuIconContainer, { backgroundColor: colors.primary }]}>
                      <Settings size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuTitle}>Admin Dashboard</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/blocked-users')}
              >
                <View style={styles.menuHeader}>
                  <View style={[styles.menuIconContainer, { backgroundColor: colors.error }]}>
                    <UserX size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>Blocked Users</Text>
                    <Text style={styles.menuSubtext}>Manage blocked accounts</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.socialLinks}>
              <Text style={styles.sectionTitle}>Social Links</Text>
              {profile?.twitter_url && (
                <TouchableOpacity 
                  style={styles.socialLink}
                  onPress={() => Linking.openURL(profile.twitter_url!)}
                >
                  <View style={[styles.socialIconContainer, { backgroundColor: '#1DA1F2' }]}>
                    <Twitter size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.socialLinkText}>Twitter</Text>
                </TouchableOpacity>
              )}
              {profile?.linkedin_url && (
                <TouchableOpacity 
                  style={styles.socialLink}
                  onPress={() => Linking.openURL(profile.linkedin_url!)}
                >
                  <View style={[styles.socialIconContainer, { backgroundColor: '#0A66C2' }]}>
                    <Linkedin size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.socialLinkText}>LinkedIn</Text>
                </TouchableOpacity>
              )}
              {profile?.instagram_url && (
                <TouchableOpacity 
                  style={styles.socialLink}
                  onPress={() => Linking.openURL(profile.instagram_url!)}
                >
                  <View style={[styles.socialIconContainer, { backgroundColor: '#E4405F' }]}>
                    <Instagram size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.socialLinkText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {profile?.github_url && (
                <TouchableOpacity 
                  style={styles.socialLink}
                  onPress={() => Linking.openURL(profile.github_url!)}
                >
                  <View style={[styles.socialIconContainer, { backgroundColor: '#333333' }]}>
                    <Github size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.socialLinkText}>GitHub</Text>
                </TouchableOpacity>
              )}
              {profile?.website_url && (
                <TouchableOpacity 
                  style={styles.socialLink}
                  onPress={() => Linking.openURL(profile.website_url!)}
                >
                  <View style={[styles.socialIconContainer, { backgroundColor: '#4CAF50' }]}>
                    <Globe size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.socialLinkText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Qualifications Section */}
            <View style={[styles.socialLinks, { marginTop: 24 }]}>
              <View style={styles.sectionHeader}>
                <Award size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Qualifications</Text>
                {!id && (
                  <TouchableOpacity 
                    onPress={handleAddQualification}
                    style={styles.addButton}
                  >
                    <Plus size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {editQualifications && editQualifications.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  {editQualifications.map((item, index) => (
                    <View key={`qual-${index}`} style={styles.socialLink}>
                      <View style={[styles.socialIconContainer, { backgroundColor: colors.primary }]}>
                        <Award size={18} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.socialLinkText, { flex: 1 }]}>{item}</Text>
                      {!id && (
                        <TouchableOpacity 
                          onPress={() => handleRemoveQualification(index)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No qualifications added yet</Text>
              )}
            </View>

            {/* Experience Section */}
            <View style={[styles.socialLinks, { marginTop: 16 }]}>
              <View style={styles.sectionHeader}>
                <Briefcase size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Experience</Text>
                {!id && (
                  <TouchableOpacity 
                    onPress={handleAddExperience}
                    style={styles.addButton}
                  >
                    <Plus size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {editExperience && editExperience.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  {editExperience.map((item, index) => (
                    <View key={`exp-${index}`} style={styles.socialLink}>
                      <View style={[styles.socialIconContainer, { backgroundColor: colors.primary }]}>
                        <Briefcase size={18} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.socialLinkText, { flex: 1 }]}>
                        {typeof item === 'string' ? item : item.experience}
                      </Text>
                      {!id && (
                        <TouchableOpacity 
                          onPress={() => handleRemoveExperience(index)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No experience added yet</Text>
              )}
            </View>

          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <TouchableOpacity 
              style={styles.sectionAction}
              onPress={() => router.push('/upload')}
            >
              <Text style={styles.sectionActionText}>Upload New</Text>
              <Upload size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {uploadedNotes.length > 0 ? (
            <View style={styles.notesGrid}>
              {uploadedNotes.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<BookOpen size={40} color={colors.textTertiary} />}
              title="No Notes Yet"
              description="You haven't uploaded any study notes yet. Start sharing your knowledge!"
              actionLabel="Upload First Note"
              onAction={() => router.push('/upload')}
            />
          )}
        </View>
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        currentBio={profile?.bio}
        currentAvatar={profile?.avatar_url}
        currentUsername={profile?.username}
        currentName={profile?.name}
        currentTwitter={profile?.twitter_url}
        currentLinkedIn={profile?.linkedin_url}
        currentInstagram={profile?.instagram_url}
        currentGitHub={profile?.github_url}
        currentWebsite={profile?.website_url}
        onUpdate={onRefresh}
      />
      
      <InterestsModal
        visible={isInterestsModalVisible}
        onClose={() => setIsInterestsModalVisible(false)}
        onSave={handleUpdateInterests}
        initialInterests={profile?.interests}
        initialSubjects={profile?.subjects}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  listContainer: {
    backgroundColor: 'rgba(108, 92, 231, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.7)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 8,
    marginVertical: 16,
  },
  statsButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
    marginBottom: 16,
  },
  addButton: {
    marginLeft: 'auto',
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 142, 204, 0.1)',
  },
  removeButton: {
    padding: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listIcon: {
    marginRight: 12,
  },
  listText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  verifiedText: {
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add extra padding at bottom
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 16,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyState: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  offlineScrollView: {
    paddingTop: 40, // Extra padding when offline banner is visible
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626', // Red color for offline state
    padding: 12,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  /* Prompt Modal styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(156,163,175,0.2)',
  },
  modalButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  header: {
    position: 'relative',
    backgroundColor: colors.background,
  },
  coverPhoto: {
    height: 120,
    backgroundColor: 'transparent',
    opacity: 0,
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: colors.background,
    opacity: 0.9,
  },
  profileSection: {
    marginTop: -50,
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.background,
  },
  defaultAvatar: {
    backgroundColor: '#2A2A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  editNameIcon: {
    marginLeft: 8,
    opacity: 0.7,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  bioLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  bioButton: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioLengthIndicator: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  bioLengthText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bioContent: {
    marginTop: 4,
  },
  bioFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  emptyBioContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyBioText: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addBioText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 6,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
  },
  secondaryAction: {
    backgroundColor: '#818CF8',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonGradient: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryAction: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuContainer: {
    gap: 12,
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  menuSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  content: {
    padding: 16,
  },


  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sectionActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  socialLinks: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  socialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  notificationText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editProfileButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  moreButton: {
    position: 'absolute',
    top: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
});