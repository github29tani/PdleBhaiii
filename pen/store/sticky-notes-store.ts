import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface StickyNote {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

type StickyNotesState = {
  // State

  notes: StickyNote[];
  isVisible: boolean;
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  setNotes: (notes: StickyNote[]) => void;
  addNote: (note: Omit<StickyNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, content: string, position: { x: number; y: number }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleVisibility: () => void;
  setActiveNote: (id: string | null) => void;
  fetchNotes: () => Promise<void>;
}

export const useStickyNotesStore = create<StickyNotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      isVisible: false,
      activeNoteId: null,
      isLoading: false,
      error: null,

      setNotes: (notes) => set({ notes }),

      fetchNotes: async () => {
        try {
          set({ isLoading: true, error: null });
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('sticky_notes')
            .select('*')
            .order('created_at', { ascending: true });

          if (error) throw error;

          const formattedNotes = data.map(note => ({
            id: note.id,
            content: note.content,
            color: note.color,
            position: { x: note.position_x, y: note.position_y },
            userId: note.user_id,
            createdAt: note.created_at,
            updatedAt: note.updated_at
          }));

          set({ notes: formattedNotes, isLoading: false });
        } catch (error) {
          console.error('Error fetching notes:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch notes',
            isLoading: false 
          });
        }
      },

      addNote: async (note) => {
        try {
          set({ isLoading: true, error: null });
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('sticky_notes')
            .insert({
              content: note.content,
              color: note.color,
              position_x: note.position.x,
              position_y: note.position.y,
              user_id: session.session.user.id
            })
            .select()
            .single();

          if (error) throw error;

          const newNote = {
            id: data.id,
            content: data.content,
            color: data.color,
            position: { x: data.position_x, y: data.position_y },
            userId: data.user_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };

          set(state => ({ 
            notes: [...state.notes, newNote],
            isLoading: false 
          }));
        } catch (error) {
          console.error('Error adding note:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add note',
            isLoading: false 
          });
        }
      },

      updateNote: async (id, content, position) => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase
            .from('sticky_notes')
            .update({
              content,
              position_x: position.x,
              position_y: position.y
            })
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            notes: state.notes.map(note =>
              note.id === id ? { ...note, content, position } : note
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error updating note:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update note',
            isLoading: false 
          });
        }
      },

      deleteNote: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase
            .from('sticky_notes')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            notes: state.notes.filter(note => note.id !== id),
            activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
            isLoading: false
          }));
        } catch (error) {
          console.error('Error deleting note:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete note',
            isLoading: false 
          });
        }
      },

      toggleVisibility: () => set(state => ({ isVisible: !state.isVisible })),
      setActiveNote: (id) => set({ activeNoteId: id }),
    }),
    {
      name: 'sticky-notes-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => {
        const { 
          notes, 
          isVisible, 
          activeNoteId,
          isLoading,
          error
        } = state;
        return { notes, isVisible, activeNoteId, isLoading, error } as Partial<StickyNotesState>;
      }
    }
  )
);
