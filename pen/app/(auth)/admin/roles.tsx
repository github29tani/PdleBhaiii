import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors } from '@/constants/colors';
import { Shield, UserPlus, Edit2, Trash2, Save, Mail, Lock } from 'lucide-react-native';
import { getAdminRoles, createAdminRole, updateAdminRole, deleteAdminRole, createInitialSuperAdmin } from '@/lib/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type Permission = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
};

const DEFAULT_PERMISSIONS: Permission[] = [
  {
    id: 'manage_users',
    name: 'Manage Users',
    description: 'Can manage user accounts',
    enabled: false
  },
  {
    id: 'manage_content',
    name: 'Manage Content',
    description: 'Can manage study materials',
    enabled: false
  },
  {
    id: 'manage_settings',
    name: 'Manage Settings',
    description: 'Can modify app settings',
    enabled: false
  },
  {
    id: 'manage_ads',
    name: 'Manage Ads',
    description: 'Can configure ad settings',
    enabled: false
  },
  {
    id: 'send_notifications',
    name: 'Send Notifications',
    description: 'Can send push notifications',
    enabled: false
  },
  {
    id: 'manage_reports',
    name: 'Manage Reports',
    description: 'Can handle content reports',
    enabled: false
  }
];

export default function AdminRoles() {
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    email: '',
    password: '',
    permissions: DEFAULT_PERMISSIONS
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles, isLoading, isError, error } = useQuery({
    queryKey: ['adminRoles'],
    queryFn: getAdminRoles
  });

  // Create initial super admin mutation
  const createSuperAdminMutation = useMutation({
    mutationFn: createInitialSuperAdmin,
    onSuccess: (data) => {
      console.log('Super admin created:', data);
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      Alert.alert('Success', 'Super admin role created and assigned successfully. Try creating a role now.');
    },
    onError: (error: any) => {
      console.error('Super admin creation error:', error);
      Alert.alert('Error', 'Failed to create super admin: ' + error.message);
    }
  });

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: createAdminRole,
    onSuccess: (data) => {
      console.log('Role created:', data);
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      setIsCreating(false);
      setNewRole({ name: '', description: '', email: '', password: '', permissions: DEFAULT_PERMISSIONS });
      Alert.alert('Success', 'Role created successfully');
    },
    onError: (error: any) => {
      console.error('Role creation error:', error);
      if (error.message.includes('No admin role assigned')) {
        Alert.alert(
          'No Admin Role',
          'You need admin privileges to create roles. Would you like to create an initial super admin role?',
          [
            {
              text: 'Yes',
              onPress: () => {
                console.log('Attempting to create super admin...');
                createSuperAdminMutation.mutate();
              }
            },
            {
              text: 'No',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create role: ' + error.message);
      }
    }
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Partial<Role> }) => 
      updateAdminRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      setEditingRole(null);
      Alert.alert('Success', 'Role updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update role');
    }
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      Alert.alert('Success', 'Role deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete role');
    }
  });

  const handleCreateRole = async () => {
    // Validate required fields
    if (!newRole.name || !newRole.description || !newRole.email || !newRole.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    if (!newRole.email.includes('@') || !newRole.email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password length
    if (newRole.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create roles');
        return;
      }

      // Check if email is already in use
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', newRole.email)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'This email is already in use');
        return;
      }

      // Create role with credentials
      createMutation.mutate(newRole, {
        onSuccess: () => {
          Alert.alert(
            'Success',
            'Role created successfully. The user can now log in with the provided credentials.'
          );
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.message || 'Failed to create role. Please try again.'
          );
        }
      });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred'
      );
    }
  };

  const handlePermissionToggle = (roleId: string, permission: Permission) => {
    const role = roles?.find((r: Role) => r.id === roleId);
    if (!role) return;

    const updatedPermissions = role.permissions.map((p: Permission) => 
      p.id === permission.id ? { ...p, enabled: !p.enabled } : p
    );

    updateMutation.mutate({
      id: roleId,
      role: { ...role, permissions: updatedPermissions }
    });
  };

  const handleDeleteRole = (role: Role) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete the role "${role.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(role.id)
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {(error as any)?.message || 'Failed to load roles'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Shield size={24} color={colors.primary} />
        <Text style={styles.headerText}>Admin Roles</Text>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setIsCreating(true)}
      >
        <UserPlus size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Create New Role</Text>
      </TouchableOpacity>

      {isCreating && (
        <Card style={styles.createCard}>
          <Text style={styles.sectionTitle}>Create New Role</Text>
          <TextInput
            style={styles.input}
            placeholder="Role Name"
            value={newRole.name}
            onChangeText={(text) => setNewRole(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Role Description"
            value={newRole.description}
            onChangeText={(text) => setNewRole(prev => ({ ...prev, description: text }))}
            multiline
          />
          
          <View style={styles.credentialsContainer}>
            <Text style={styles.sectionTitle}>Login Credentials</Text>
            <View style={styles.inputWithIcon}>
              <Mail size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, styles.iconInput]}
                placeholder="Email Address"
                value={newRole.email}
                onChangeText={(text) => setNewRole(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWithIcon}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, styles.iconInput]}
                placeholder="Password"
                value={newRole.password}
                onChangeText={(text) => setNewRole(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>Default Permissions</Text>
            {newRole.permissions.map(permission => (
              <View key={permission.id} style={styles.permission}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionName}>{permission.name}</Text>
                  <Text style={styles.permissionDescription}>
                    {permission.description}
                  </Text>
                </View>
                <Switch
                  value={permission.enabled}
                  onValueChange={() => {
                    setNewRole(prev => ({
                      ...prev,
                      permissions: prev.permissions.map(p =>
                        p.id === permission.id ? { ...p, enabled: !p.enabled } : p
                      )
                    }));
                  }}
                />
              </View>
            ))}
          </View>
          <View style={styles.createActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsCreating(false);
                setNewRole({ name: '', description: '', email: '', password: '', permissions: DEFAULT_PERMISSIONS });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleCreateRole}
              disabled={createMutation.isPending}
            >
              <Save size={18} color={colors.white} />
              <Text style={styles.saveButtonText}>
                {createMutation.isPending ? 'Creating...' : 'Create Role'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      <View style={styles.rolesGrid}>
        {roles?.map(role => (
          <Card key={role.id} style={styles.roleCard}>
            <View style={styles.roleHeader}>
              <View>
                <Text style={styles.roleName}>{role.name}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <View style={styles.roleActions}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setEditingRole(role)}
                >
                  <Edit2 size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.iconButton, styles.deleteButton]}
                  onPress={() => handleDeleteRole(role)}
                >
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.permissionsContainer}>
              <Text style={styles.permissionsTitle}>Permissions</Text>
              {role.permissions.map(permission => (
                <View key={permission.id} style={styles.permission}>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionName}>{permission.name}</Text>
                    <Text style={styles.permissionDescription}>
                      {permission.description}
                    </Text>
                  </View>
                  <Switch
                    value={permission.enabled}
                    onValueChange={() => handlePermissionToggle(role.id, permission)}
                    disabled={updateMutation.isPending}
                  />
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  rolesGrid: {
    gap: 20,
  },
  roleCard: {
    padding: 20,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  roleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
  },
  permissionsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  permission: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
  },
  permissionName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  createCard: {
    padding: 20,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  createActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  credentialsContainer: {
    marginBottom: 24,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  iconInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
});
