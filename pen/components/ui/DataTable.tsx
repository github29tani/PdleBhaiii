import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Column = {
  id: string;
  label: string;
};

type PaginationProps = {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
};

type DataTableProps = {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  pagination?: PaginationProps;
};

export function DataTable({ columns, data, isLoading, pagination }: DataTableProps) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal>
        <View>
          {/* Header */}
          <View style={styles.headerRow}>
            {columns.map((column) => (
              <View key={column.id} style={styles.headerCell}>
                <Text style={styles.headerText}>{column.label}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {data.map((row, index) => (
            <View key={index} style={styles.dataRow}>
              {columns.map((column) => (
                <View key={column.id} style={styles.dataCell}>
                  {typeof row[column.id] === 'object' ? (
                    row[column.id]
                  ) : (
                    <Text style={styles.dataText}>{row[column.id]}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Pagination */}
      {pagination && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => pagination.setPage(pagination.page - 1)}
            disabled={pagination.page === 0}
            style={[
              styles.pageButton,
              pagination.page === 0 && styles.pageButtonDisabled,
            ]}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.pageText}>
            Page {pagination.page + 1} of {pagination.totalPages}
          </Text>
          
          <TouchableOpacity
            onPress={() => pagination.setPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages - 1}
            style={[
              styles.pageButton,
              pagination.page === pagination.totalPages - 1 &&
                styles.pageButtonDisabled,
            ]}
          >
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  loading: ViewStyle;
  headerRow: ViewStyle;
  headerCell: ViewStyle;
  headerText: TextStyle;
  dataRow: ViewStyle;
  dataCell: ViewStyle;
  dataText: TextStyle;
  pagination: ViewStyle;
  pageButton: ViewStyle;
  pageButtonDisabled: ViewStyle;
  pageText: TextStyle;
};

const styles: Styles = {
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  headerCell: {
    padding: 16,
    minWidth: 150,
  },
  headerText: {
    fontWeight: '600',
    color: '#333',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dataCell: {
    padding: 16,
    minWidth: 150,
  },
  dataText: {
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageButton: {
    padding: 8,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    marginHorizontal: 16,
    color: '#666',
  },
};
