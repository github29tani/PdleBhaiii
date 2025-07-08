import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from 'react-native';
import PrivacyPolicy from '@/components/PrivacyPolicy';
import Logo from '@/components/Logo'; // Import the Logo component

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const { isAdmin, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
  
  // Handle redirection after successful login
  useEffect(() => {
    if (!loginSuccessful || loading) return;

    const { hasCompletedOnboarding } = useAuthStore.getState();
    
    // Check if user is admin
    if (isAdmin) {
      router.replace('/admin');
    } else if (!hasCompletedOnboarding) {
      router.replace('/(auth)/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [loginSuccessful, loading, isAdmin, router]);
  
  const handleLogin = async () => {
    if (!acceptPrivacyPolicy) {
      return;
    }
    try {
      setLoginSuccessful(false); // Reset before attempting login
      await login(email, password);
      setLoginSuccessful(true);
    } catch (err) {
      console.error('Login error:', err);
    }
  };
  
  const handleSignup = () => {
    router.push('/(auth)/signup');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size={120} style={styles.logo} />
            <Text style={styles.title}>PdleBhaii</Text>
            <Text style={styles.subtitle}>Study Buddy</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Log In</Text>
            
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon={<Mail size={20} color={colors.textTertiary} />}
            />
            
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
            />

            <TouchableOpacity 
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPasswordLink}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            <View style={styles.privacyPolicyContainer}>
              <TouchableOpacity 
                onPress={() => setAcceptPrivacyPolicy(!acceptPrivacyPolicy)}
                style={[
                  styles.privacyPolicyCheckbox,
                  acceptPrivacyPolicy && styles.privacyPolicyCheckboxChecked
                ]}
              >
                {acceptPrivacyPolicy && (
                  <>
                    <View style={styles.privacyPolicyCheckMark} />
                    <View style={styles.privacyPolicyCheckMarkInner} />
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.privacyPolicyText}>
                I agree to the{' '}
                <TouchableOpacity 
                  onPress={() => setShowPrivacyPolicy(true)}
                  style={styles.privacyPolicyLink}
                >
                  <Text style={styles.privacyPolicyLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </Text>
            </View>

            <Button
              title="Log In"
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={!email || !password || !acceptPrivacyPolicy}
              style={styles.loginButton}
              icon={<ArrowRight size={20} color="#FFFFFF" />}
              iconPosition="right"
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <Button
              title="Create an Account"
              onPress={handleSignup}
              variant="outline"
              style={styles.signupButton}
            />
          </View>
          
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={showPrivacyPolicy}
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <PrivacyPolicy />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60, // Makes it circular if the logo is square
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 15,
  },
  privacyPolicyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  privacyPolicyCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: 4,
    marginRight: 10,
  },
  privacyPolicyCheckMark: {
    width: 12,
    height: 8,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 4,
    left: 4,
  },
  privacyPolicyText: {
    color: colors.textSecondary,
  },
  privacyPolicyLink: {
    flex: 1,
  },
  forgotPassword: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: colors.textSecondary,
  },
  signupLink: {
    color: colors.primary,
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
  formContainer: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: `${colors.error}15`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textTertiary,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  signupButton: {
    marginBottom: 24,
  },
  termsText: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 12,
  }
});