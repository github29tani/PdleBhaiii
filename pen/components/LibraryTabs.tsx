import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue 
} from 'react-native-reanimated';

interface LibraryTabsProps {
  activeTab: 'downloads' | 'wishlist';
  onTabChange: (tab: 'downloads' | 'wishlist') => void;
}

export const LibraryTabs: React.FC<LibraryTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabWidth = Dimensions.get('window').width / 2;
  const translateX = useSharedValue(activeTab === 'downloads' ? 0 : tabWidth);

  const handleTabPress = (tab: 'downloads' | 'wishlist') => {
    translateX.value = withSpring(tab === 'downloads' ? 0 : tabWidth);
    onTabChange(tab);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => handleTabPress('downloads')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'downloads' && styles.activeTabText
          ]}>
            Downloads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => handleTabPress('wishlist')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'wishlist' && styles.activeTabText
          ]}>
            Wishlist
          </Text>
        </TouchableOpacity>

        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    width: '50%',
    height: 2,
    backgroundColor: colors.primary,
  },
});
