import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors } from '@/constants/colors';
import { Settings, Bell, Lock, Shield, Gift, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AppSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    allowNotifications: true,
    unlockWithAds: true,
    adsToUnlock: '3',
    maxLoginAttempts: '5',
    sessionTimeout: '30',
    supportEmail: 'support@studysphere.com',
    telegramLink: 'https://t.me/studysphere',
  });

  const handleChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;

      const loadedSettings: Record<string, any> = {};
      data?.forEach(setting => {
        loadedSettings[setting.key] = setting.value;
      });

      setSettings(prev => ({ ...prev, ...loadedSettings }));
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.rpc('update_app_setting', {
        p_settings: settings
      });

      if (error) throw error;

      Alert.alert('Success', 'Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color={colors.primary} />
        <Text style={styles.headerText}>App Settings</Text>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>General Settings</Text>
        <View style={styles.setting}>
          <View style={styles.settingLabelContainer}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.settingLabel}>Maintenance Mode</Text>
          </View>
          <Switch
            value={settings.maintenanceMode}
            onValueChange={(value) => handleChange('maintenanceMode', value)}
          />
        </View>
        <View style={styles.setting}>
          <View style={styles.settingLabelContainer}>
            <Shield size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Allow New Registrations</Text>
          </View>
          <Switch
            value={settings.allowNewRegistrations}
            onValueChange={(value) => handleChange('allowNewRegistrations', value)}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        <View style={styles.setting}>
          <View style={styles.settingLabelContainer}>
            <Lock size={20} color={colors.success} />
            <Text style={styles.settingLabel}>Require Email Verification</Text>
          </View>
          <Switch
            value={settings.requireEmailVerification}
            onValueChange={(value) => handleChange('requireEmailVerification', value)}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Max Login Attempts</Text>
          <TextInput
            style={styles.input}
            value={settings.maxLoginAttempts}
            onChangeText={(value) => handleChange('maxLoginAttempts', value)}
            keyboardType="numeric"
            placeholder="5"
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Session Timeout (minutes)</Text>
          <TextInput
            style={styles.input}
            value={settings.sessionTimeout}
            onChangeText={(value) => handleChange('sessionTimeout', value)}
            keyboardType="numeric"
            placeholder="30"
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <View style={styles.setting}>
          <View style={styles.settingLabelContainer}>
            <Bell size={20} color={colors.info} />
            <Text style={styles.settingLabel}>Allow Push Notifications</Text>
          </View>
          <Switch
            value={settings.allowNotifications}
            onValueChange={(value) => handleChange('allowNotifications', value)}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Content Access Settings</Text>
        <View style={styles.setting}>
          <View style={styles.settingLabelContainer}>
            <Gift size={20} color={colors.secondary} />
            <Text style={styles.settingLabel}>Unlock with Ads</Text>
          </View>
          <Switch
            value={settings.unlockWithAds}
            onValueChange={(value) => handleChange('unlockWithAds', value)}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Ads to Unlock Content</Text>
          <TextInput
            style={styles.input}
            value={settings.adsToUnlock}
            onChangeText={(value) => handleChange('adsToUnlock', value)}
            keyboardType="numeric"
            placeholder="3"
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Support Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Support Email</Text>
          <TextInput
            style={styles.input}
            value={settings.supportEmail}
            onChangeText={(value) => handleChange('supportEmail', value)}
            keyboardType="email-address"
            placeholder="support@studysphere.com"
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Telegram Group Link</Text>
          <TextInput
            style={styles.input}
            value={settings.telegramLink}
            onChangeText={(value) => handleChange('telegramLink', value)}
            placeholder="https://t.me/studysphere"
          />
        </View>
      </Card>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
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
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
