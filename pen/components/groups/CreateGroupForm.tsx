import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { X, Plus, Users, BookOpen, Lock, Mail, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type GroupType = 'public' | 'private' | 'invite-only';

export function CreateGroupForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  console.log('Rendering CreateGroupForm');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<GroupType>('public');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  if (!user) throw new Error('User must be logged in to create a group');

  const handleCreateGroup = async () => {
    console.log('handleCreateGroup called');
    if (!name.trim() || !subject.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    setIsLoading(true);
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([
          {
            name: name.trim(),
            description: description.trim(),
            subject: subject.trim(),
            type,
            admin_id: user.id,
            verified: false,
            member_count: 1, // Start with 1 member (the creator)
          },
        ])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as a member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: group.id,
            user_id: user.id,
            role: 'owner',
          },
        ]);

      if (memberError) throw memberError;

      Alert.alert('Success', 'Group created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Group</Text>
        <TouchableOpacity onPress={onCancel} disabled={isLoading}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter group name"
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., NEET Biology, JEE Maths"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell members what this group is about"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Type *</Text>
          <View style={styles.typeOptions}>
            <TouchableOpacity
              style={[styles.typeOption, type === 'public' && styles.typeOptionActive]}
              onPress={() => setType('public')}
            >
              <Users size={18} color={type === 'public' ? colors.background : colors.text} />
              <Text style={[styles.typeText, type === 'public' && styles.typeTextActive]}>
                Public
              </Text>
              {type === 'public' && <Check size={18} color={colors.background} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeOption, type === 'private' && styles.typeOptionActive]}
              onPress={() => setType('private')}
            >
              <Lock size={18} color={type === 'private' ? colors.background : colors.text} />
              <Text style={[styles.typeText, type === 'private' && styles.typeTextActive]}>
                Private
              </Text>
              {type === 'private' && <Check size={18} color={colors.background} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeOption, type === 'invite-only' && styles.typeOptionActive]}
              onPress={() => setType('invite-only')}
            >
              <Mail size={18} color={type === 'invite-only' ? colors.background : colors.text} />
              <Text style={[styles.typeText, type === 'invite-only' && styles.typeTextActive]}>
                Invite Only
              </Text>
              {type === 'invite-only' && <Check size={18} color={colors.background} />}
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            {type === 'public' 
              ? 'Anyone can join and view content' 
              : type === 'private' 
                ? 'Anyone can find this group, but only members can see content'
                : 'Only people with an invite can join'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.createButton, (!name || !subject) && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={!name || !subject || isLoading}
        >
          {isLoading ? (
            <Text style={styles.createButtonText}>Creating...</Text>
          ) : (
            <>
              <Plus size={20} color={colors.background} />
              <Text style={styles.createButtonText}>Create Group</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    marginLeft: 8,
    color: colors.text,
    fontWeight: '500',
  },
  typeTextActive: {
    color: colors.background,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
