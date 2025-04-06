import { ChatMessage } from './types';
import uuid from 'react-native-uuid';

export const createUserMessage = (text: string): ChatMessage => ({
  id: uuid.v4() as string,
  text,
  createdAt: new Date(),
  user: {
    _id: 1,
    name: 'User',
  },
});

export const createBotMessage = (text: string): ChatMessage => ({
  id: uuid.v4() as string,
  text,
  createdAt: new Date(),
  user: {
    _id: 2,
    name: 'Pomodoro Bot',
  },
});

export const formatChatHistory = (messages: ChatMessage[]): string => {
  return messages
    .map(msg => `${msg.user.name}: ${msg.text}`)
    .reverse()
    .join('\n');
};

export const sanitizeMessage = (text: string): string => {
  return text.trim();
};

export const isValidMessage = (text: string): boolean => {
  return text.trim().length > 0;
};
