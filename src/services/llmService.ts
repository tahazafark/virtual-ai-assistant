import { createParser } from 'eventsource-parser';

interface LLMResponse {
  text: string;
  error?: string;
}

export class LLMService {
  private static instance: LLMService;
  private API_URL = 'https://api.deepseek.com/v1/chat/completions';
  private API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

  private constructor() {}

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async processMessage(message: string, botType: string): Promise<LLMResponse> {
    try {
      if (!this.API_KEY) {
        throw new Error('DeepSeek API key not found. Please check your environment variables.');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(botType),
            },
            {
              role: 'user',
              content: message,
            },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      let fullText = '';
      const parser = createParser((event) => {
        if (event.type === 'event') {
          try {
            const data = JSON.parse(event.data);
            const content = data.choices[0]?.delta?.content || '';
            fullText += content;
          } catch (error) {
            console.error('Error parsing SSE data:', error);
          }
        }
      });

      // Process the response as a stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(new TextDecoder().decode(value));
      }

      return { text: fullText };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        text: '',
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while processing your message.',
      };
    }
  }

  private getSystemPrompt(botType: string): string {
    const prompts = {
      general: `You are a helpful AI assistant focused on general tasks and conversation. 
               You provide clear, concise, and accurate responses while maintaining a friendly tone.`,
      
      voice: `You are a voice interaction specialist, focused on natural conversation and voice commands.
              Your responses are optimized for speech output, using clear language and natural pacing.
              Keep responses concise and easy to follow when spoken aloud.`,
      
      image: `You are an image processing assistant, helping with image-related tasks and analysis.
              You provide detailed descriptions and insights about images while maintaining technical accuracy.`,
      
      task: `You are a task management specialist, helping organize and track activities.
             You break down complex tasks into manageable steps and provide clear action items.
             Focus on practical, actionable advice and time management.`,
      
      email: `You are an email assistant, helping compose and manage email communications.
              You help draft professional emails, suggest improvements, and maintain appropriate tone.
              Focus on clarity, professionalism, and effective communication.`,
    };
    return prompts[botType as keyof typeof prompts] || prompts.general;
  }
}

export const llmService = LLMService.getInstance();