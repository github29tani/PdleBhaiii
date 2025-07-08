import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { DataTable } from '../../components/ui/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function UsersManagement() {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery(
    ['users', filter, page],
    async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .range(page * 10, (page + 1) * 10 - 1);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  );

  const toggleUserStatus = useMutation(
    async ({ userId, newStatus }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      if (error) throw error;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
      },
    }
  );

  const columns = [
    { id: 'email', label: 'Email' },
    { id: 'full_name', label: 'Name' },
    { id: 'status', label: 'Status' },
    { id: 'created_at', label: 'Joined' },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <View style={styles.filters}>
          {['all', 'active', 'inactive', 'banned'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.activeFilter,
              ]}
              onPress={() => setFilter(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === status && styles.activeFilterText,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={users?.map((user) => ({
            ...user,
            actions: (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() =>
                    toggleUserStatus.mutate({
                      userId: user.id,
                      newStatus: user.status === 'active' ? 'banned' : 'active',
                    })
                  }
                >
                  <Ionicons
                    name={user.status === 'active' ? 'ban' : 'checkmark-circle'}
                    size={24}
                    color={user.status === 'active' ? '#ff4444' : '#00C851'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    // View user details
                  }}
                >
                  <Ionicons name="eye" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ),
          }))}
          isLoading={isLoading}
          pagination={{
            page,
            setPage,
            totalPages: 10, // Replace with actual total pages calculation
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
};
