import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';
import PrivacyPolicy from '@/components/PrivacyPolicy';
import Logo from '@/components/Logo';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading, error } = useAuthStore();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const validateForm = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  const handleSignup = async () => {
    if (!validateForm()) return;
    
    try {
      await signup(name, username, email, password);
      // Show success message and redirect to login
      router.push('/(auth)/login');
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };
  
  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size={120} style={styles.logo} />
            <Text style={styles.title}>PdleBhaii</Text>
            <Text style={styles.subtitle}>Study Buddy</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            
            {error && (
              <View style={styles.messageContainer}>
                <Text style={[
                  styles.messageText,
                  error.includes('confirm your account') ? styles.successText : styles.errorText
                ]}>
                  {error}
                </Text>
              </View>
            )}
            
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon={<User size={20} color={colors.textTertiary} />}
            />
            
            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              leftIcon={<User size={20} color={colors.textTertiary} />}
            />
            
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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={colors.textTertiary} />}
              error={passwordError}
            />
            
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={colors.textTertiary} />}
            />
            
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
              title="Create Account"
              onPress={handleSignup}
              isLoading={isLoading}
              style={styles.signupButton}
              icon={<ArrowRight size={20} color="#FFFFFF" />}
              iconPosition="right"
              disabled={!acceptPrivacyPolicy}
            />
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Modal
            visible={showPrivacyPolicy}
            onRequestClose={() => setShowPrivacyPolicy(false)}
          >
            <PrivacyPolicy />
          </Modal>

          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <TouchableOpacity 
              onPress={() => setShowPrivacyPolicy(true)}
              style={styles.termsLink}
            >
              <Text style={styles.termsLink}>Terms of Service</Text>
            </TouchableOpacity>
            {' '}and{' '}
            <TouchableOpacity 
              onPress={() => setShowPrivacyPolicy(true)}
              style={styles.termsLink}
            >
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  privacyPolicyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  privacyPolicyCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyPolicyCheckboxChecked: {
    backgroundColor: colors.primary,
  },
  privacyPolicyCheckMark: {
    width: 16,
    height: 16,
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  privacyPolicyCheckMarkInner: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'absolute',
    top: 4,
    left: 4,
    transform: [{ rotate: '45deg' }],
  },
  privacyPolicyText: {
    color: colors.textSecondary,
  },
  privacyPolicyLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60, 
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
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
  messageContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    backgroundColor: `${colors.error}15`,
  },
  successText: {
    color: colors.success,
    backgroundColor: `${colors.success}15`,
  },
  signupButton: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginText: {
    color: colors.textSecondary,
    marginRight: 4,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  termsText: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 12,
  }
});