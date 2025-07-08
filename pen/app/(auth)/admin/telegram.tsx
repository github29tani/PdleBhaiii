import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors } from '@/constants/colors';
import { MessageCircle, Link, Users, Bell, Trash2, Plus, Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/context/AuthContext';

type TelegramGroup = {
  id: string;
  name: string;
  link: string;
  description: string;
  member_count: number;
  created_at: string;
  updated_at: string;
};

export default function TelegramGroups() {
  const { isAdmin, loading: authLoading } = useContext(AuthContext);
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState<Partial<TelegramGroup>>({
    name: '',
    link: '',
    description: '',
    member_count: 0
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        setError('Unauthorized: Admin access required');
        setLoading(false);
        return;
      }
      fetchGroups();
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      const subscription = supabase
        .channel('telegram_groups')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'telegram_groups' },
          (payload) => {
            fetchGroups();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  const fetchGroups = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGroups(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addGroup = async () => {
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      return;
    }

    try {
      if (!newGroup.name || !newGroup.link) {
        setError('Name and link are required');
        return;
      }

      console.log('Adding new group:', newGroup);
      const { data, error: insertError } = await supabase
        .rpc('insert_telegram_group', {
          p_name: newGroup.name,
          p_link: newGroup.link,
          p_description: newGroup.description || '',
          p_member_count: newGroup.member_count || 0
        });

      if (insertError) {
        console.error('Supabase error:', insertError);
        throw insertError;
      }

      console.log('Group added successfully:', data);
      setNewGroup({ name: '', link: '', description: '', member_count: 0 });
      setError(null);
      fetchGroups(); // Refresh the list
    } catch (err) {
      console.error('Full error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add group');
    }
  };

  const deleteGroup = async (id: string) => {
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .rpc('delete_telegram_group', {
          p_id: id
        });

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    }
  };

  const updateMemberCount = async (id: string, count: number) => {
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .rpc('update_telegram_group_count', {
          p_id: id,
          p_count: count
        });

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member count');
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unauthorized: Admin access required</Text>
        <TouchableOpacity 
          style={styles.setupButton}
          onPress={async () => {
            try {
              const { success, error } = await setupAdminAccess();
              if (success) {
                // Reload the page to refresh admin status
                window.location.reload();
              } else {
                setError(error instanceof Error ? error.message : 'Failed to set up admin access');
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to set up admin access');
            }
          }}
        >
          <Text style={styles.setupButtonText}>Set Up Admin Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <Card style={styles.addGroupCard}>
        <Text style={styles.title}>Add New Telegram Group</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={newGroup.name}
            onChangeText={(text) => setNewGroup(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Group Link"
            value={newGroup.link}
            onChangeText={(text) => setNewGroup(prev => ({ ...prev, link: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={newGroup.description}
            onChangeText={(text) => setNewGroup(prev => ({ ...prev, description: text }))}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Member Count"
            value={newGroup.member_count?.toString() || '0'}
            onChangeText={(text) => {
              const count = text === '' ? 0 : parseInt(text);
              setNewGroup(prev => ({ ...prev, member_count: isNaN(count) ? 0 : count }));
            }}
            keyboardType="numeric"
          />
          <TouchableOpacity 
            style={[styles.addButton, (!newGroup.name || !newGroup.link) && styles.disabledButton]} 
            onPress={addGroup}
            disabled={!newGroup.name || !newGroup.link}
          >
            <Plus size={20} color={colors.text} />
            <Text style={styles.addButtonText}>Add Group</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {groups.map((group) => (
        <Card key={group.id} style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{group.name}</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deleteGroup(group.id)}
            >
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>{group.description}</Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Link size={16} color={colors.primary} />
              <TouchableOpacity onPress={() => Linking.openURL(group.link)}>
                <Text style={[styles.statText, styles.link]}>Join Group</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stat}>
              <Users size={16} color={colors.success} />
              <Text style={styles.statText}>{group.member_count} members</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notifyButton}
            onPress={() => updateMemberCount(group.id, group.member_count + 1)}
          >
            <Bell size={18} color={colors.text} />
            <Text style={styles.notifyButtonText}>Update Member Count</Text>
          </TouchableOpacity>
        </Card>
      ))}
    </ScrollView>
  );
}

import { setupAdminAccess } from '@/lib/admin';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  addGroupCard: {
    marginBottom: 16,
    padding: 16,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.card,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    padding: 8,
  },
  description: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: colors.text,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  notifyButton: {
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notifyButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FF000020',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error || '#FF0000',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  setupButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setupButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
