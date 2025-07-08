import { Configuration, OpenAIApi } from 'openai';
import { supabase } from '../supabase';

// Initialize OpenAI with configuration
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

class StudyAssistant {
  // Generate study notes based on topic and complexity
  static async generateStudyNotes(topic: string, complexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate') {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a helpful study assistant. Create comprehensive study notes about ${topic} at a ${complexity} level.`
          },
          {
            role: "user",
            content: `Generate detailed study notes about ${topic} at a ${complexity} level.`
          }
        ],
        temperature: 0.7,
      });

      return response.data.choices[0]?.message?.content || 'Failed to generate study notes.';
    } catch (error) {
      console.error('Error generating study notes:', error);
      throw new Error('Failed to generate study notes');
    }
  }

  // Create flashcards from study material
  static async createFlashcards(content: string, count: number = 5) {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Create ${count} flashcards from the following study material. Format as JSON array with 'question' and 'answer' fields.`
          },
          {
            role: "user",
            content: content
          }
        ],
        temperature: 0.5,
      });

      const flashcards = JSON.parse(response.data.choices[0]?.message?.content || '[]');
      return Array.isArray(flashcards) ? flashcards : [];
    } catch (error) {
      console.error('Error creating flashcards:', error);
      return [];
    }
  }

  // Generate practice questions
  static async generatePracticeQuestions(topic: string, count: number = 5, questionType: 'mcq' | 'short' | 'essay' = 'mcq') {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Generate ${count} ${questionType.toUpperCase()} questions about ${topic}. Format as JSON array with 'question', 'options' (for MCQ), and 'answer' fields.`
          }
        ],
        temperature: 0.7,
      });

      const questions = JSON.parse(response.data.choices[0]?.message?.content || '[]');
      return Array.isArray(questions) ? questions : [];
    } catch (error) {
      console.error('Error generating practice questions:', error);
      return [];
    }
  }

  // Get personalized study recommendations
  static async getStudyRecommendations(userId: string) {
    try {
      // Get user's study history
      const { data: studySessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Analyze the following study sessions and provide personalized study recommendations. Focus on patterns and suggest improvements.`
          },
          {
            role: "user",
            content: `Study sessions: ${JSON.stringify(studySessions)}`
          }
        ],
        temperature: 0.7,
      });

      return response.data.choices[0]?.message?.content || 'No recommendations available.';
    } catch (error) {
      console.error('Error getting study recommendations:', error);
      return 'Failed to generate study recommendations.';
    }
  }

  // Summarize text for better understanding
  static async summarizeText(text: string, length: 'short' | 'medium' | 'detailed' = 'medium') {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Create a ${length} summary of the following text. Focus on key points and main ideas.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.5,
      });

      return response.data.choices[0]?.message?.content || 'Failed to generate summary.';
    } catch (error) {
      console.error('Error summarizing text:', error);
      return 'Failed to generate summary.';
    }
  }
}

export default StudyAssistant;
