import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { Feather } from '@expo/vector-icons';
import StickyNote from './StickyNote';
import { colors } from '@/constants/colors';

const COLORS = [
  '#ffd54f', // Amber
  '#ff8a65', // Deep Orange
  '#4db6ac', // Teal
  '#64b5f6', // Blue
  '#ba68c8', // Purple
  '#81c784', // Green
  '#ff7043', // Deep Orange
];

interface Note {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
}



const { width: screenWidth } = Dimensions.get('window');

export default function StickyNotesContainer() {
  const [notes, setNotes] = useState<Note[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading notes:', error);
      return;
    }

    setNotes(data || []);
  };

  const addNote = async () => {
    const newNote = {
      content: 'New note...',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      position: { x: Math.random() * 100 + 50, y: Math.random() * 100 + 50 },
      user_id: user?.id,
    };

    const { data, error } = await supabase
      .from('sticky_notes')
      .insert([newNote])
      .select()
      .single();

    if (error) {
      console.error('Error adding note:', error);
      return;
    }

    setNotes([...notes, data]);
  };

  const updateNote = async (id: string, content: string, position: { x: number; y: number }) => {
    const { error } = await supabase
      .from('sticky_notes')
      .update({ content, position, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return;
    }

    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="edit-3" size={40} color={colors.textTertiary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No sticky notes yet</Text>
          <Text style={styles.emptyText}>Tap the + button to create your first note</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={addNote}
          >
            <Feather name="plus" size={24} color={colors.primary} />
            <Text style={styles.emptyButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.notesGrid}>
          {notes.map(note => (
            <StickyNote
              key={note.id}
              {...note}
              onDelete={deleteNote}
              onUpdate={updateNote}
            />
          ))}
        </View>
      )}
      {notes.length > 0 && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addNote}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  notesGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-around',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
});
