import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input'; // Import Input component
import { useAuthStore } from '@/store/auth-store';

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
  { id: 'cuet', name: 'CUET' }
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
  { id: 'computer_science', name: 'Computer Science' }
];

const languages = [
  { id: 'english', name: 'English' },
  { id: 'hindi', name: 'Hindi' },
  { id: 'gujarati', name: 'Gujarati' },
  { id: 'marathi', name: 'Marathi' },
  { id: 'bengali', name: 'Bengali' },
  { id: 'tamil', name: 'Tamil' },
  { id: 'telugu', name: 'Telugu' },
  { id: 'kannada', name: 'Kannada' },
  { id: 'malayalam', name: 'Malayalam' },
  { id: 'punjabi', name: 'Punjabi' },
  { id: 'urdu', name: 'Urdu' }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setInterests, setSubjects: setUserSubjects, setLanguages: setUserLanguages } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['english']); // English by default
  const [otherLanguage, setOtherLanguage] = useState('');
  const [showOtherLanguageInput, setShowOtherLanguageInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [customLanguages, setCustomLanguages] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  const getColumnCount = () => {
    if (screenWidth < 360) return 2;
    if (screenWidth < 768) return 3;
    return 4;
  };

  const columnCount = getColumnCount();
  const gap = 8;
  const cardWidth = (screenWidth - (gap * (columnCount + 1))) / columnCount;

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleLanguageToggle = (languageId: string) => {
    if (languageId === 'other') {
      setShowOtherLanguageInput(prev => !prev);
      return;
    }

    setSelectedLanguages(prev => {
      if (prev.includes(languageId)) {
        return prev.filter(id => id !== languageId);
      } else {
        return [...prev, languageId];
      }
    });
  };

  const handleOtherLanguageSubmit = () => {
    if (otherLanguage.trim()) {
      const formattedLanguage = otherLanguage.trim();
      const newLang = {
        id: formattedLanguage.toLowerCase(),
        name: formattedLanguage
      };
      
      setCustomLanguages(prev => {
        if (!prev.find(lang => lang.id === newLang.id)) {
          return [...prev, newLang];
        }
        return prev;
      });
      
      setSelectedLanguages(prev => {
        if (!prev.includes(newLang.id)) {
          return [...prev, newLang.id];
        }
        return prev;
      });
      
      setOtherLanguage('');
      setShowOtherLanguageInput(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedClasses.length === 0) {
      return; // Show error or alert
    }
    if (step === 2 && selectedSubjects.length === 0) {
      return; // Show error or alert
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (selectedLanguages.length === 0) {
      return; // Show error or alert
    }

    setIsLoading(true);
    try {
      await Promise.all([
        setInterests(selectedClasses),
        setUserSubjects(selectedSubjects),
        setUserLanguages(selectedLanguages)
      ]);
      router.push('/(tabs)');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Show error toast or alert here
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'What are you studying?';
      case 2:
        return 'Select your subjects';
      case 3:
        return 'Choose languages';
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return 'Choose your classes or exams';
      case 2:
        return 'Pick the subjects you\'re interested in';
      case 3:
        return 'Select languages you can read notes in';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step {step} of 3</Text>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
        </View>

        <View style={[styles.grid, { gap }]}>
          {step === 1 && (
            classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={[
                  styles.card,
                  { width: cardWidth },
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
            ))
          )}

          {step === 2 && (
            subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.card,
                  { width: cardWidth },
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
            ))
          )}

          {step === 3 && (
            <>
              {[...languages, ...customLanguages, { id: 'other', name: 'Other' }].map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.card,
                    { width: cardWidth },
                    selectedLanguages.includes(lang.id) && styles.selectedCard,
                    lang.id === 'other' && showOtherLanguageInput && styles.selectedCard
                  ]}
                  onPress={() => handleLanguageToggle(lang.id)}
                >
                  <Text style={[
                    styles.cardText,
                    selectedLanguages.includes(lang.id) && styles.selectedCardText,
                    lang.id === 'other' && showOtherLanguageInput && styles.selectedCardText
                  ]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {showOtherLanguageInput && (
                <View style={[styles.otherInputContainer, { width: '100%' }]}>
                  <Input
                    label="Enter Language"
                    value={otherLanguage}
                    onChangeText={setOtherLanguage}
                    placeholder="Type your language"
                    style={{ flex: 1 }}
                  />
                  <Button 
                    title="Add" 
                    onPress={handleOtherLanguageSubmit}
                    disabled={!otherLanguage.trim()}
                    style={styles.addButton}
                  />
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {step === 3 ? (
            <>
              <Button
                title="Complete"
                onPress={handleComplete}
                isLoading={isLoading}
                disabled={selectedLanguages.length === 0}
                style={styles.button}
              />
              <TouchableOpacity onPress={handleBack}>
                <Text style={styles.backButton}>Go Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Button
                title="Next"
                onPress={handleNext}
                disabled={step === 1 ? selectedClasses.length === 0 : selectedSubjects.length === 0}
                style={styles.button}
              />
              {step > 1 && (
                <TouchableOpacity onPress={handleBack}>
                  <Text style={styles.backButton}>Go Back</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  stepText: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 800,
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginVertical: 6,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    backgroundColor: colors.primary,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  selectedCardText: {
    color: colors.background,
  },
  buttonContainer: {
    marginTop: 'auto',
    gap: 12,
  },
  button: {
    marginBottom: 12,
    paddingVertical: 16,
    minHeight: 56,
  },
  backButton: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 12,
  },
  otherInputContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    minWidth: 80,
    minHeight: 56,
  },
});