import React from 'react';
import { Bot, MessageSquare, Image, Calendar, Mail } from 'lucide-react';
import { useAIStore } from '../store/useAIStore';
import type { BotType } from '../types';

const bots = [
  {
    id: 'general' as BotType,
    name: 'General Assistant',
    icon: Bot,
  },
  {
    id: 'voice' as BotType,
    name: 'Voice Assistant',
    icon: MessageSquare,
  },
  {
    id: 'image' as BotType,
    name: 'Image Processing',
    icon: Image,
  },
  {
    id: 'task' as BotType,
    name: 'Task Manager',
    icon: Calendar,
  },
  {
    id: 'email' as BotType,
    name: 'Email Assistant',
    icon: Mail,
  },
];

export const BotSelector: React.FC = () => {
  const { activeBotType, setActiveBotType } = useAIStore();

  return (
    <div className="flex flex-col gap-2 p-4 border-r bg-gray-50">
      {bots.map((bot) => {
        const Icon = bot.icon;
        return (
          <button
            key={bot.id}
            onClick={() => setActiveBotType(bot.id)}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              activeBotType === bot.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{bot.name}</span>
          </button>
        );
      })}
    </div>
  );
};