import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Loader, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useAIStore } from '../store/useAIStore';
import { voiceRecognition } from '../services/voiceRecognition';
import { textToSpeech } from '../services/textToSpeech';
import { llmService } from '../services/llmService';

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages,
    addMessage, 
    isProcessing,
    isSpeaking,
    setProcessing,
    setSpeaking,
    activeBotType,
    clearMessages
  } = useAIStore();

  useEffect(() => {
    setVoiceSupported(voiceRecognition.isSupported());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = () => {
    if (isListening) {
      voiceRecognition.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    voiceRecognition.startListening(
      (text) => {
        setInput(text);
        setIsListening(false);
      },
      (error) => {
        console.error('Voice recognition error:', error);
        setIsListening(false);
        addMessage({
          content: `Error: ${error}`,
          role: 'assistant',
          botType: activeBotType,
        });
      }
    );
  };

  const speakResponse = (text: string) => {
    if (!ttsEnabled) return;
    
    setSpeaking(true);
    textToSpeech.speak(text, () => setSpeaking(false));
  };

  const toggleTTS = () => {
    if (isSpeaking) {
      textToSpeech.stop();
      setSpeaking(false);
    }
    setTtsEnabled(!ttsEnabled);
  };

  const processMessage = async (content: string) => {
    setProcessing(true);
    
    try {
      const response = await llmService.processMessage(content, activeBotType);
      
      if (response.error) {
        const errorMessage = {
          content: `Error: ${response.error}`,
          role: 'assistant' as const,
          botType: activeBotType,
        };
        addMessage(errorMessage);
        return;
      }

      const assistantMessage = {
        content: response.text,
        role: 'assistant' as const,
        botType: activeBotType,
      };
      
      addMessage(assistantMessage);
      speakResponse(response.text);
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage({
        content: 'Sorry, I encountered an error while processing your message.',
        role: 'assistant',
        botType: activeBotType,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');

    addMessage({
      content: userMessage,
      role: 'user',
      botType: activeBotType,
    });

    await processMessage(userMessage);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <button
          onClick={toggleTTS}
          className={`p-2 rounded-full transition-colors ${
            ttsEnabled ? 'text-blue-500' : 'text-gray-400'
          } hover:bg-gray-100`}
          title={ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
        >
          {isSpeaking ? (
            <Volume2 className="w-5 h-5 animate-pulse" />
          ) : (
            ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />
          )}
        </button>
        
        <button
          onClick={clearMessages}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
          title="Clear conversation"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block max-w-[70%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
        <div className="flex items-center gap-2">
          {voiceSupported && (
            <button
              type="button"
              className={`p-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              onClick={handleVoiceInput}
              disabled={isProcessing}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Type your message...'}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isListening || isProcessing}
          />
          
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
          >
            {isProcessing ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};