import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from './Button';

interface InterestsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (interests: string[], subjects: string[]) => void;
  initialInterests?: string[];
  initialSubjects?: string[];
}

const classes = [
  { id: 'class10', name: 'Class 10' },
  { id: 'class11', name: 'Class 11' },
  { id: 'class12', name: 'Class 12' },
  { id: 'btech', name: 'B.Tech' },
  { id: 'bcom', name: 'B.Com' },
  { id: 'bsc', name: 'B.Sc' },
  { id: 'upsc', name: 'UPSC' },
  { id: 'jee', name: 'JEE' },
  { id: 'neet', name: 'NEET' },
  { id: 'ca', name: 'CA/CS' },
  { id: 'ssc', name: 'SSC' },
  { id: 'cuet', name: 'CUET' },
  { id: 'none', name: 'None' },
  { id: 'other', name: 'Other' }
];

const subjects = [
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
  { id: 'mathematics', name: 'Mathematics' },
  { id: 'history', name: 'History' },
  { id: 'geography', name: 'Geography' },
  { id: 'literature', name: 'Literature' },
  { id: 'economics', name: 'Economics' },
  { id: 'computer_science', name: 'Computer Science' },
  { id: 'none', name: 'None' },
  { id: 'other', name: 'Other' }
];

export function InterestsModal({ visible, onClose, onSave, initialInterests = [], initialSubjects = [] }: InterestsModalProps) {
  // Convert initial display names back to IDs
  const initialClassIds = initialInterests.map(name => 
    classes.find(c => c.name === name)?.id || ''
  ).filter(id => id !== '');
  
  const initialSubjectIds = initialSubjects.map(name =>
    subjects.find(s => s.name === name)?.id || ''
  ).filter(id => id !== '');

  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialClassIds);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubjectIds);
  const [otherClass, setOtherClass] = useState('');
  const [otherSubject, setOtherSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => {
      if (classId === 'none') {
        return ['none'];
      }
      const withoutNone = prev.filter(id => id !== 'none');
      if (prev.includes(classId)) {
        return withoutNone.filter(id => id !== classId);
      } else {
        return [...withoutNone, classId];
      }
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (subjectId === 'none') {
        return ['none'];
      }
      const withoutNone = prev.filter(id => id !== 'none');
      if (prev.includes(subjectId)) {
        return withoutNone.filter(id => id !== subjectId);
      } else {
        return [...withoutNone, subjectId];
      }
    });
  };

  const handleSave = async () => {
    if (selectedClasses.length === 0 || selectedSubjects.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      // Convert IDs to display names
      const selectedClassNames = selectedClasses.map(id => {
        if (id === 'other') return otherClass;
        return classes.find(c => c.id === id)?.name || '';
      }).filter(name => name !== '');
      
      const selectedSubjectNames = selectedSubjects.map(id => {
        if (id === 'other') return otherSubject;
        return subjects.find(s => s.id === id)?.name || '';
      }).filter(name => name !== '');

      await onSave(selectedClassNames, selectedSubjectNames);
      onClose();
    } catch (error) {
      console.error('Failed to save interests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Update Interests</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What are you studying?</Text>
            <Text style={styles.sectionSubtitle}>Choose your classes or exams</Text>
            <View style={styles.grid}>
              {classes.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={[
                    styles.card,
                    selectedClasses.includes(classItem.id) && styles.selectedCard
                  ]}
                  onPress={() => handleClassToggle(classItem.id)}
                >
                  <Text style={[
                    styles.cardText,
                    selectedClasses.includes(classItem.id) && styles.selectedCardText
                  ]}>
                    {classItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedClasses.includes('other') && (
              <View style={styles.otherInputContainer}>
                <TextInput
                  style={styles.otherInput}
                  placeholder="Enter your class/exam"
                  value={otherClass}
                  onChangeText={setOtherClass}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select your subjects</Text>
            <Text style={styles.sectionSubtitle}>Pick the subjects you're interested in</Text>
            <View style={styles.grid}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.card,
                    selectedSubjects.includes(subject.id) && styles.selectedCard
                  ]}
                  onPress={() => handleSubjectToggle(subject.id)}
                >
                  <Text style={[
                    styles.cardText,
                    selectedSubjects.includes(subject.id) && styles.selectedCardText
                  ]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedSubjects.includes('other') && (
              <View style={styles.otherInputContainer}>
                <TextInput
                  style={styles.otherInput}
                  placeholder="Enter your subject"
                  value={otherSubject}
                  onChangeText={setOtherSubject}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            isLoading={isLoading}
            disabled={selectedClasses.length === 0 || selectedSubjects.length === 0 ||
              (selectedClasses.includes('other') && !otherClass) ||
              (selectedSubjects.includes('other') && !otherSubject)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  card: {
    width: '45%',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  selectedCardText: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  otherInputContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  otherInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
});
