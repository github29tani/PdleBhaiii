import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

type Note = {
  id: string;
  content: string;
  topic_id?: string;
  topic_type?: string;
  created_at: string;
  updated_at: string;
};

export function useNotes() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async (topicId?: string) => {
    if (!user?.id) return [];
    
    setLoading(true);
    try {
      let query = supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id);
      
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      
      const { data, error: fetchError } = await query.order('updated_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setNotes(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
      Alert.alert('Error', 'Failed to load notes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    if (!user?.id) return null;
    
    try {
      const noteData = {
        ...note,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      
      let data, error;
      
      if (note.id) {
        // Update existing note
        const { data: updateData, error: updateError } = await supabase
          .from('user_notes')
          .update(noteData)
          .eq('id', note.id)
          .select()
          .single();
          
        data = updateData;
        error = updateError;
      } else {
        // Create new note
        const { data: insertData, error: insertError } = await supabase
          .from('user_notes')
          .insert([{ ...noteData, created_at: new Date().toISOString() }])
          .select()
          .single();
          
        data = insertData;
        error = insertError;
      }
      
      if (error) throw error;
      
      // Refresh notes list
      await fetchNotes(note.topic_id);
      
      return data;
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
      Alert.alert('Error', 'Failed to save note');
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    if (!user?.id) return false;
    
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Refresh notes list
      await fetchNotes();
      
      return true;
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
      Alert.alert('Error', 'Failed to delete note');
      return false;
    }
  };

  // Load notes when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotes();
    }
  }, [user?.id]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    saveNote,
    deleteNote,
  };
}

// Hook to manage a single note
export function useNote(noteId?: string) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchNote = async (id: string) => {
    if (!user?.id) return null;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      setNote(data);
      return data;
    } catch (err) {
      console.error('Error fetching note:', err);
      setError('Failed to load note');
      Alert.alert('Error', 'Failed to load note');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load note when component mounts or noteId changes
  useEffect(() => {
    if (noteId) {
      fetchNote(noteId);
    } else {
      setNote(null);
      setLoading(false);
    }
  }, [noteId]);

  return {
    note,
    loading,
    error,
    fetchNote,
  };
}
