import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { colors } from '@/constants/colors';

const PrivacyPolicy = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@pdlebhaii.com');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>

      <Text style={styles.sectionTitle}>1. User Data Collected</Text>
      <Text style={styles.content}>
        • Name, phone number, email address
        • Book browsing and purchase history
        • Referral activity and code usage
        • UPI/bank information (for future rewards/payouts)
        • Device and IP data (for fraud protection)
      </Text>

      <Text style={styles.sectionTitle}>2. Why Data is Collected</Text>
      <Text style={styles.content}>
        • Account creation and login
        • Tracking referrals and points
        • Sending notifications and offers
        • Fraud detection
        • Affiliate tracking and reward redemption
      </Text>

      <Text style={styles.sectionTitle}>3. How Data is Used</Text>
      <Text style={styles.content}>
        • Data is used internally only - no data is sold to any third party
        • Shared only with:
          - Payment partners (for cashout if any)
          - Affiliate platforms (Amazon, etc.)
          - Legal authorities (only if required by law)
      </Text>

      <Text style={styles.sectionTitle}>4. Cookie/Tracking Info</Text>
      <Text style={styles.content}>
        • Basic analytics/cookies may be used to improve app functionality
        • Tracking is used for affiliate sales (redirect links)
      </Text>

      <Text style={styles.sectionTitle}>5. User Rights</Text>
      <Text style={styles.content}>
        • Option to update or delete your account
        • Contact support to delete personal data
        • Can opt-out of marketing messages
      </Text>

      <Text style={styles.sectionTitle}>6. Children's Data</Text>
      <Text style={styles.content}>
        • This app is not intended for users below 13 years of age
      </Text>

      <Text style={styles.sectionTitle}>7. Policy Updates</Text>
      <Text style={styles.content}>
        • This privacy policy may be updated from time to time
        • Users will be notified in-app or by email about any significant changes
      </Text>

      <Text style={styles.sectionTitle}>8. Contact Information</Text>
      <View style={styles.contactContainer}>
        <Pressable onPress={handleEmailPress} style={styles.contactItem}>
          <Text style={styles.contactText}>Email: support@pdlebhaii.com</Text>
        </Pressable>
        <Text style={styles.contactText}>Phone/WhatsApp: +91-XXXXXXXXXX</Text>
      </View>

      <Text style={styles.lastUpdated}>Last Updated: June 2025</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },
  content: {
    fontSize: 16,
    marginBottom: 15,
    color: colors.text,
  },
  contactContainer: {
    marginTop: 20,
  },
  contactItem: {
    marginBottom: 10,
  },
  contactText: {
    fontSize: 16,
    color: colors.primary,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 20,
    textAlign: 'right',
  },
});

export default PrivacyPolicy;
