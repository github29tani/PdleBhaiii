import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors } from '@/constants/colors';
import { MonitorPlay } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settings-store';

export default function AdSettings() {
  const { settings, updateSettings } = useSettingsStore();

  const handleChange = (key: string, value: string | boolean) => {
    updateSettings({ [key]: value });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MonitorPlay size={24} color={colors.primary} />
        <Text style={styles.headerText}>Ad Settings</Text>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Ad Networks</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Enable AdMob</Text>
          <Switch
            value={settings.admobEnabled}
            onValueChange={(value) => handleChange('admobEnabled', value)}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Ad Types</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Banner Ads</Text>
          <Switch
            value={settings.bannerAdsEnabled}
            onValueChange={(value) => handleChange('bannerAdsEnabled', value)}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Rewarded Ads</Text>
          <Switch
            value={settings.rewardedAdsEnabled}
            onValueChange={(value) => handleChange('rewardedAdsEnabled', value)}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Interstitial Ads</Text>
          <Switch
            value={settings.interstitialAdsEnabled}
            onValueChange={(value) => handleChange('interstitialAdsEnabled', value)}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Ad IDs</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Banner Ad ID</Text>
          <TextInput
            style={styles.input}
            value={settings.admobBannerId}
            onChangeText={(value) => handleChange('admobBannerId', value)}
            placeholder="Enter Banner Ad ID"
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Rewarded Ad ID</Text>
          <TextInput
            style={styles.input}
            value={settings.admobRewardedId}
            onChangeText={(value) => handleChange('admobRewardedId', value)}
            placeholder="Enter Rewarded Ad ID"
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Interstitial Ad ID</Text>
          <TextInput
            style={styles.input}
            value={settings.admobInterstitialId}
            onChangeText={(value) => handleChange('admobInterstitialId', value)}
            placeholder="Enter Interstitial Ad ID"
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Ad Frequency</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Banner Refresh Rate (seconds)</Text>
          <TextInput
            style={styles.input}
            value={settings.bannerRefreshRate}
            onChangeText={(value) => handleChange('bannerRefreshRate', value)}
            keyboardType="numeric"
            placeholder="60"
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Rewarded Video Interval (seconds)</Text>
          <TextInput
            style={styles.input}
            value={settings.rewardedInterval}
            onChangeText={(value) => handleChange('rewardedInterval', value)}
            keyboardType="numeric"
            placeholder="300"
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Interstitial Frequency (screens)</Text>
          <TextInput
            style={styles.input}
            value={settings.interstitialFrequency}
            onChangeText={(value) => handleChange('interstitialFrequency', value)}
            keyboardType="numeric"
            placeholder="5"
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
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
  section: {
    marginBottom: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
});
