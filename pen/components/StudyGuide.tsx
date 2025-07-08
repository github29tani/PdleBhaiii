import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import StudyAssistant from '@/lib/ai/studyAssistant';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

type StudyGuide = {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  guideId: string;
};

const StudyGuide = () => {
  const { user } = useAuthStore();
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<StudyGuide | null>(null);
  const [newGuideTitle, setNewGuideTitle] = useState('');
  const [newGuideSubject, setNewGuideSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateGuide, setShowCreateGuide] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStudyGuides();
    }
  }, [user]);

  const fetchStudyGuides = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('study_guides')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching study guides:', error);
      Alert.alert('Error', 'Failed to load study guides');
    } finally {
      setIsLoading(false);
    }
  };

  const createStudyGuide = async () => {
    if (!newGuideTitle.trim() || !newGuideSubject.trim()) return;

    try {
      setIsLoading(true);
      
      // Generate study guide content using AI
      const content = await StudyAssistant.generateStudyNotes(newGuideSubject, 'intermediate');
      
      // Create the guide in Supabase
      const { data, error } = await supabase
        .from('study_guides')
        .insert([
          {
            title: newGuideTitle,
            subject: newGuideSubject,
            content,
            user_id: user?.id,
          }
        ])
        .select();

      if (error) throw error;

      // Generate flashcards from the content
      const flashcards = await StudyAssistant.createFlashcards(content);
      
      // Save flashcards to Supabase
      await supabase.from('flashcards').insert(
        flashcards.map(card => ({
          question: card.question,
          answer: card.answer,
          guide_id: data[0].id,
          user_id: user?.id,
        }))
      );

      setGuides([...guides, data[0]]);
      setNewGuideTitle('');
      setNewGuideSubject('');
      setShowCreateGuide(false);
    } catch (error) {
      console.error('Error creating study guide:', error);
      Alert.alert('Error', 'Failed to create study guide');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFlashcards = async (guideId: string) => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('guide_id', guideId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setFlashcards(data || []);
      setCurrentFlashcardIndex(0);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      Alert.alert('Error', 'Failed to load flashcards');
    }
  };

  const nextFlashcard = () => {
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
    }
  };

  const previousFlashcard = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(currentFlashcardIndex - 1);
    }
  };

  const toggleFlashcardAnswer = () => {
    // Toggle the answer visibility
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Guides</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateGuide(!showCreateGuide)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showCreateGuide && (
        <View style={styles.createGuideForm}>
          <TextInput
            style={styles.input}
            placeholder="Guide Title"
            value={newGuideTitle}
            onChangeText={setNewGuideTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={newGuideSubject}
            onChangeText={setNewGuideSubject}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowCreateGuide(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.createButton]}
              onPress={createStudyGuide}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Guide</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.guidesList}>
        {guides.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            style={styles.guideCard}
            onPress={() => {
              setSelectedGuide(guide);
              loadFlashcards(guide.id);
            }}
          >
            <View style={styles.guideHeader}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideSubject}>{guide.subject}</Text>
            </View>
            <Text style={styles.guideDate}>
              {new Date(guide.updatedAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedGuide && flashcards.length > 0 && (
        <View style={styles.flashcardsContainer}>
          <View style={styles.flashcard}>
            <Text style={styles.flashcardQuestion}>
              {flashcards[currentFlashcardIndex].question}
            </Text>
            <TouchableOpacity 
              style={styles.toggleAnswerButton}
              onPress={toggleFlashcardAnswer}
            >
              <MaterialCommunityIcons 
                name="eye" 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={previousFlashcard}
              disabled={currentFlashcardIndex === 0}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={currentFlashcardIndex === 0 ? '#ccc' : colors.primary} 
              />
            </TouchableOpacity>
            <Text style={styles.flashcardIndex}>
              {currentFlashcardIndex + 1}/{flashcards.length}
            </Text>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={nextFlashcard}
              disabled={currentFlashcardIndex === flashcards.length - 1}
            >
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={currentFlashcardIndex === flashcards.length - 1 ? '#ccc' : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  createButton: {
    padding: 8,
  },
  createGuideForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  guidesList: {
    flex: 1,
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  guideSubject: {
    fontSize: 14,
    color: '#666',
  },
  guideDate: {
    fontSize: 12,
    color: '#999',
  },
  flashcardsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  flashcard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  flashcardQuestion: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  toggleAnswerButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  navButton: {
    padding: 8,
  },
  flashcardIndex: {
    fontSize: 14,
    color: '#666',
  },
});

export default StudyGuide;
