import { Configuration, OpenAIApi } from 'openai';
import { supabase } from '../supabase';

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-2';

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class AIService {
  private static instance: AIService;
  private model: AIModel = 'gpt-4';
  private temperature: number = 0.7;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async chat(messages: AIMessage[]): Promise<string> {
    try {
      const response = await openai.createChatCompletion({
        model: this.model,
        messages,
        temperature: this.temperature,
      });

      return response.data.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment.';
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  public async generateStudyMaterials(topic: string, level: string): Promise<{
    summary: string;
    keyPoints: string[];
    questions: Array<{ question: string; answer: string }>;
  }> {
    const prompt = `Generate a study guide about ${topic} for a ${level} level student. Include a summary, 5 key points, and 3 practice questions with answers.`;
    
    const response = await this.chat([
      { role: 'system', content: 'You are a helpful study assistant that creates educational content.' },
      { role: 'user', content: prompt }
    ]);

    // Parse the response into structured data
    // This is a simplified example - you'd want to implement more robust parsing
    const sections = response.split('\n\n');
    
    return {
      summary: sections[0] || '',
      keyPoints: sections[1]?.split('\n').slice(0, 5) || [],
      questions: sections[2]?.split('\n').slice(0, 3).map(qa => {
        const [question, answer] = qa.split('?').map(s => s.trim());
        return { question: question + '?', answer };
      }) || []
    };
  }

  public async analyzeStudyHabits(userId: string): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    // Get user's study data from Supabase
    const { data: studySessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId);

    // Analyze the data using AI
    const prompt = `Analyze these study sessions and provide insights:\n${JSON.stringify(studySessions, null, 2)}`;
    
    const response = await this.chat([
      { role: 'system', content: 'You are an educational data analyst. Provide insights about study habits.' },
      { role: 'user', content: prompt }
    ]);

    // Parse the response (simplified example)
    return {
      strengths: response.match(/Strengths:([\s\S]*?)(?=Weaknesses:)/)?.[1]?.split('\n').filter(Boolean) || [],
      weaknesses: response.match(/Weaknesses:([\s\S]*?)(?=Recommendations:)/)?.[1]?.split('\n').filter(Boolean) || [],
      recommendations: response.match(/Recommendations:([\s\S]*)/)?.[1]?.split('\n').filter(Boolean) || []
    };
  }
}

export const aiService = AIService.getInstance();
