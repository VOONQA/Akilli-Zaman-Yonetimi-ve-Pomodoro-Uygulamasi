import { useState, useCallback } from 'react';
import { ChatMessage } from '../services/chatbot/types';
import { generateResponse } from '../services/chatbot/openai';
import {
  createUserMessage,
  createBotMessage,
  isValidMessage,
  sanitizeMessage,
} from '../services/chatbot/utils';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!isValidMessage(text)) return;

    const sanitizedText = sanitizeMessage(text);
    const userMessage = createUserMessage(sanitizedText);

    setMessages(prev => [userMessage, ...prev]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateResponse(sanitizedText);
      const botMessage = createBotMessage(response);
      setMessages(prev => [botMessage, ...prev]);
    } catch (err) {
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      console.error('Chat Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};

export default useChat;
