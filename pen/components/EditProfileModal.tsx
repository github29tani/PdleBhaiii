import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { Camera, User, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentBio?: string;
  currentAvatar?: string;
  currentUsername?: string;
  currentName?: string;
  currentTwitter?: string;
  currentLinkedIn?: string;
  currentInstagram?: string;
  currentGitHub?: string;
  currentWebsite?: string;
  currentPassword?: string;
  onUpdate: () => void;
}

export function EditProfileModal({ 
  isVisible, 
  onClose, 
  currentBio, 
  currentAvatar, 
  currentUsername, 
  currentName, 
  currentTwitter,
  currentLinkedIn,
  currentInstagram,
  currentGitHub,
  currentWebsite,
  currentPassword,
  onUpdate 
}: EditProfileModalProps) {
  const [bio, setBio] = useState(currentBio || '');
  const [avatar, setAvatar] = useState<string | undefined>(currentAvatar);
  const [username, setUsername] = useState(currentUsername || '');
  const [name, setName] = useState(currentName || '');
  const [twitter, setTwitter] = useState(currentTwitter || '');
  const [linkedIn, setLinkedIn] = useState(currentLinkedIn || '');
  const [instagram, setInstagram] = useState(currentInstagram || '');
  const [github, setGitHub] = useState(currentGitHub || '');
  const [website, setWebsite] = useState(currentWebsite || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [nameError, setNameError] = useState('');
  const [uploading, setUploading] = useState(false);
  const { user, updateUser } = useAuthStore();

  const validateUsername = async (value: string) => {
    if (value === currentUsername) return true;
    if (value.length < 4) {
      setUsernameError('Username must be at least 4 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    // Check if username is unique
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .neq('id', user?.id)
      .single();
    
    if (data) {
      setUsernameError('Username is already taken');
      return false;
    }
    
    setUsernameError('');
    return true;
  };

  const validatePassword = () => {
    if (password && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (password && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploading(true);
      try {
        const photo = result.assets[0];
        
        // For web, we need to handle the URI properly
        let blob;
        if (photo.uri.startsWith('data:')) {
          // Handle base64 data URL
          const base64Data = photo.uri.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          blob = new Blob(byteArrays, { type: 'image/jpeg' });
        } else {
          // Handle file URI
          const response = await fetch(photo.uri);
          blob = await response.blob();
        }

        const fileName = `${user?.id}-${Date.now()}.jpg`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update the profile with the new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user?.id);

        if (updateError) throw updateError;

        setAvatar(publicUrl);
        updateUser({ avatar_url: publicUrl });
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      // Validate username before saving
      if (username !== currentUsername) {
        const isValid = await validateUsername(username);
        if (!isValid) {
          return;
        }
      }

      // Validate password if being changed
      if (password) {
        const isValidPassword = validatePassword();
        if (!isValidPassword) {
          return;
        }

        // Update password in Supabase Auth
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password
        });

        if (passwordError) {
          Alert.alert('Error', 'Failed to update password. Please try again.');
          return;
        }
      }
      
      const updatedProfile = {
        name,
        username,
        bio,
        avatar_url: avatar,
        twitter_url: twitter,
        linkedin_url: linkedIn,
        instagram_url: instagram,
        github_url: github,
        website_url: website,
        ...(password && { password: password }) // Store in profiles table as well
      };

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23514') {
          setUsernameError('Username must be at least 4 characters');
          return;
        }
        throw updateError;
      }

      // Update local user state
      updateUser(updatedProfile);
      onUpdate();
      onClose();

      if (password) {
        Alert.alert('Success', 'Password updated successfully. Please log in again with your new password.');
        // Sign out user after password change for security
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    }
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Edit Profile</Text>
        
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image 
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <User size={50} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.avatarActions}>
            <TouchableOpacity 
              style={[styles.avatarButton, styles.editAvatarButton]} 
              onPress={pickImage}
            >
              <Camera size={20} color={colors.background} />
            </TouchableOpacity>
            {avatar && (
              <TouchableOpacity 
                style={[styles.avatarButton, styles.removeAvatarButton]}
                onPress={async () => {
                  setAvatar(undefined);
                  const { error } = await supabase
                    .from('profiles')
                    .update({ avatar_url: null })
                    .eq('id', user?.id);
                  
                  if (error) {
                    console.error('Error removing avatar:', error);
                    return;
                  }
                  
                  updateUser({ avatar_url: undefined });
                }}
              >
                <X size={20} color={colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError('');
          }}
          placeholder="Enter your name"
          autoCapitalize="words"
        />
        {nameError ? (
          <Text style={styles.errorText}>{nameError}</Text>
        ) : null}

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.bioInput, usernameError ? styles.inputError : null]}
          value={username}
          onChangeText={(text) => {
            setUsername(text.toLowerCase());
            setUsernameError('');
          }}
          placeholder="Choose a unique username"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {usernameError ? (
          <Text style={styles.errorText}>{usernameError}</Text>
        ) : null}

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          multiline
          maxLength={500}
        />

        <Text style={styles.sectionTitle}>Social Media Links</Text>

        <Text style={styles.label}>Twitter</Text>
        <TextInput
          style={styles.input}
          value={twitter}
          onChangeText={setTwitter}
          placeholder="https://twitter.com/username"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>LinkedIn</Text>
        <TextInput
          style={styles.input}
          value={linkedIn}
          onChangeText={setLinkedIn}
          placeholder="https://linkedin.com/in/username"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          style={styles.input}
          value={instagram}
          onChangeText={setInstagram}
          placeholder="https://instagram.com/username"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>GitHub</Text>
        <TextInput
          style={styles.input}
          value={github}
          onChangeText={setGitHub}
          placeholder="https://github.com/username"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          placeholder="https://yourwebsite.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.sectionTitle}>Security</Text>

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <View style={styles.actions}>
          <Button 
            title="Cancel" 
            onPress={onClose} 
            variant="outline"
            style={styles.button}
          />
          <Button 
            title={uploading ? "Saving..." : "Save"} 
            onPress={handleSave}
            disabled={uploading}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  inputError: {
    borderColor: colors.error,
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    backgroundColor: '#2A2A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActions: {
    position: 'absolute',
    bottom: 0,
    right: '20%',
    flexDirection: 'row',
    gap: 8,
  },
  avatarButton: {
    padding: 8,
    borderRadius: 20,
  },
  editAvatarButton: {
    backgroundColor: colors.primary,
  },
  removeAvatarButton: {
    backgroundColor: colors.error,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});
