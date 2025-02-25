import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, BotType } from '../types';

interface AIState {
  messages: Message[];
  activeBotType: BotType;
  isProcessing: boolean;
  isSpeaking: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setActiveBotType: (type: BotType) => void;
  setProcessing: (status: boolean) => void;
  setSpeaking: (status: boolean) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      messages: [],
      activeBotType: 'general',
      isProcessing: false,
      isSpeaking: false,
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        }],
      })),
      
      setActiveBotType: (type) => set({ activeBotType: type }),
      setProcessing: (status) => set({ isProcessing: status }),
      setSpeaking: (status) => set({ isSpeaking: status }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'ai-assistant-storage',
      partialize: (state) => ({
        messages: state.messages,
        activeBotType: state.activeBotType,
      }),
    }
  )
);