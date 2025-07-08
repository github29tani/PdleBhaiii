import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useBooks } from '../../../hooks/useBooks';

export default function BrowsePage() {
  const { books, isLoading, error } = useBooks();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text>Browse Books</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});