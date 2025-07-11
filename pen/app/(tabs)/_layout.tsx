import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Home, Search, Upload, BookMarked, User, BarChart3, MessageSquare } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'expo-router';
import { FloatingNotesButton } from '@/components/FloatingNotesButton';
import { FloatingBookBazaarButton } from '@/components/FloatingBookBazaarButton';
import { GroupListModal } from '@/components/groups/GroupListModal';
import { NotesModal } from '@/components/NotesModal';
import { colors } from '@/constants/colors';

const sharedShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
};

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalButtonSecondaryText: {
    color: colors.primary,
  },
  
  // Header styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    ...sharedShadow,
  },
  headerTitle: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 20,
    ...sharedShadow,
  },
  notificationButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 20,
    ...sharedShadow,
  },
  headerIconButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...sharedShadow,
  },
});

// Custom Header Component
const CustomHeader = ({ 
  title, 
  navigation, 
  onGroupPress 
}: { 
  title: string, 
  navigation: any,
  onGroupPress?: () => void 
}) => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <View style={styles.headerContainer}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerTitle}>{title}</Text>
        </TouchableOpacity>
      </View>
      {isAuthenticated && onGroupPress && (
        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={onGroupPress}
        >
          <MessageSquare size={20} color={colors.background} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function TabLayout() {

  const [showGroupModal, setShowGroupModal] = React.useState(false);
  const [showNotesModal, setShowNotesModal] = React.useState(false);
  const [showBookBazaar, setShowBookBazaar] = React.useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  React.useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated });
    console.log('Group modal state:', { showGroupModal });
  }, [isAuthenticated, showGroupModal]);
  
  const getTabColor = (routeName: string) => {
    switch (routeName) {
      case 'index': return '#FF6B6B';  // Bright coral red
      case 'search': return '#4ECDC4'; // Bright turquoise
      case 'upload': return '#45B7D1';  // Bright sky blue
      case 'library': return '#96CEB4'; // Mint green
      case 'profile': return '#FFBE0B'; // Bright yellow
      case 'stats': return '#8B9467'; // Sage green
      case 'book-bazaar': return '#9C27B0'; // Purple
      default: return colors.primary;
    }
  };

  const getTabBackground = (routeName: string, focused: boolean) => {
    if (!focused) return '#F3F4F6';  // Light gray when not selected
    switch (routeName) {
      case 'index': return '#FFE5E5';   // Light red
      case 'search': return '#E5F9F7';  // Light turquoise
      case 'upload': return '#E5F4F9';  // Light blue
      case 'library': return '#EDF7F3';  // Light green
      case 'profile': return '#FFF7E5';  // Light yellow
      case 'stats': return '#F7F4E9';  // Light sage
      case 'book-bazaar': return '#F5E5FC'; // Light purple
      default: return '#F3F4F6';
    }
  };

  const styles = StyleSheet.create({
    iconContainer: {
      padding: 12,
      borderRadius: 30,
      marginBottom: 4,
    },
    activeIcon: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      alignSelf: 'flex-start',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    headerTitle: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    notificationButton: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
  });

  return (
    <>
      <Tabs
      screenOptions={({ route, navigation }) => ({
        header: ({ navigation }) => (
          <CustomHeader 
            title={
              route.name === 'index' ? 'Home' : 
              route.name === 'book-bazaar' ? 'Book Bazaar' :
              route.name.charAt(0).toUpperCase() + route.name.slice(1)
            } 
            navigation={navigation} 
            onGroupPress={() => setShowGroupModal(true)}
          />
        ),
        tabBarActiveTintColor: getTabColor(route.name),
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: {
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colors.background,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabel: () => null,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 24,
          color: colors.text,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
          letterSpacing: 0.5,
        },
        headerTitleAlign: 'left',
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        headerShadowVisible: false,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.button : colors.surface, // Using light green for active state
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              boxShadow: focused ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
            }}>
              <Home size={24} color={focused ? '#000000' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.25 : 0,
              shadowRadius: 3.84,
            }}>
              <Search size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="upload"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.25 : 0,
              shadowRadius: 3.84,
            }}>
              <Upload size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            } else if (route.name === 'upload') {
              e.preventDefault();
              navigation.navigate('upload');
            }
          },
        })}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              boxShadow: focused ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
            }}>
              <BarChart3 size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              boxShadow: focused ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
            }}>
              <BookMarked size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              boxShadow: focused ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
            }}>
              <User size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      </Tabs>
      {isAuthenticated && (
        <>
          <FloatingNotesButton onPress={() => setShowNotesModal(true)} />
          <FloatingBookBazaarButton onPress={() => router.push('/book-bazaar')} />
          
          <GroupListModal
            visible={showGroupModal}
            onClose={() => setShowGroupModal(false)}
          />
          <NotesModal
            visible={showNotesModal}
            onClose={() => setShowNotesModal(false)}
          />
        </>
      )}
    </>
  );
}