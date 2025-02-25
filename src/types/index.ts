export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  botType: BotType;
}

export type BotType = 'general' | 'voice' | 'image' | 'task' | 'email';

export interface Bot {
  id: BotType;
  name: string;
  description: string;
  icon: string;
  capabilities: string[];
}