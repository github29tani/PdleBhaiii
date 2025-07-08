import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  Alert
} from 'react-native';
import { X, Save, Trash2, Maximize2, Minimize2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useNotes } from '@/hooks/useNotes';

type Note = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  topic_id?: string;
  topic_type?: string;
};

type NoteCardProps = {
  note: Note;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  topicId?: string;
  topicType?: string;
};

export function NotesModal({ visible, onClose, topicId, topicType }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ content: '', topic_id: topicId, topic_type: topicType });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { notes: allNotes, saveNote, deleteNote } = useNotes();

  useEffect(() => {
    if (visible && allNotes) {
      // Filter notes by topic if topicId is provided
      const filteredNotes = topicId 
        ? allNotes.filter(note => note.topic_id === topicId)
        : allNotes;
      setNotes(filteredNotes);
    }
  }, [visible, allNotes, topicId]);

  const handleSave = async () => {
    if (!newNote.content?.trim()) return;
    
    setIsSaving(true);
    try {
      const savedNote = await saveNote({
        ...newNote,
        content: newNote.content || '',
        topic_id: newNote.topic_id,
        topic_type: newNote.topic_type,
      });
      
      if (savedNote) {
        setNotes(prev => [...prev, savedNote]);
        setNewNote({ content: '', topic_id: topicId, topic_type: topicType });
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Error', 'Failed to delete note');
    }
  };

  const handleEdit = (note: Note) => {
    setNewNote(note);
  };

  const NoteCard = ({ note, onDelete, onEdit }: NoteCardProps) => {
    const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return (
      <TouchableOpacity
        style={styles.noteCard}
        onPress={() => onEdit(note)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formattedDate}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(note.id)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardContent} numberOfLines={3}>
          {note.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={!isFullscreen}
      onRequestClose={onClose}
      statusBarTranslucent={!isFullscreen}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, isFullscreen ? styles.fullscreen : styles.modal]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Notes</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => setIsFullscreen(!isFullscreen)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isFullscreen ? (
                <Minimize2 size={20} color={colors.text} />
              ) : (
                <Maximize2 size={20} color={colors.text} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
          
          <TextInput
            style={styles.input}
            placeholder="Write a new note..."
            placeholderTextColor={colors.textSecondary}
            multiline
            value={newNote.content}
            onChangeText={(text) => setNewNote({ ...newNote, content: text })}
            onContentSizeChange={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: true });
              }
            }}
            autoFocus
          />
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={handleSave}
            disabled={isSaving || !newNote.content.trim()}
          >
            <Save size={20} color={colors.background} />
            <Text style={[styles.buttonText, { color: colors.background }]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modal: {
    margin: 20,
    marginTop: 50,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  fullscreen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for the save button
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardContent: {
    fontSize: 16,
    color: colors.text,
  },
  deleteButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
