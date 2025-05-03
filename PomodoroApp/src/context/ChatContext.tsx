import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { generateResponse } from '../services/chatbot/openai';

export interface Message {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
    avatar?: any;
  };
}

interface ChatContextType {
  isVisible: boolean;
  messages: Message[];
  setIsVisible: (visible: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  isTyping: boolean;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Hoş geldin mesajını göster
  React.useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        _id: 1,
        text: "Merhaba! Ben Pomodoro asistanınızım. Size nasıl yardımcı olabilirim? Pomodoro tekniği, görev yönetimi veya uygulama özellikleri hakkında sorular sorabilirsiniz.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Pomodoro Bot',
        },
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      _id: Date.now(),
      text,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: 'User',
      },
    };

    setMessages(prevMessages => [userMessage, ...prevMessages]);
    setIsTyping(true);

    try {
      // API'den yanıt al
      const response = await generateResponse(text);
      
      // Yanıt metnini ekle
      const botMessage: Message = {
        _id: Date.now() + 1,
        text: response,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Pomodoro Bot',
        },
      };

      setMessages(prevMessages => [botMessage, ...prevMessages]);
    } catch (error) {
      // Hata durumunda kullanıcıyı bilgilendir
      const errorMessage: Message = {
        _id: Date.now() + 1,
        text: 'Üzgünüm, şu anda yanıt oluşturamıyorum. Lütfen daha sonra tekrar deneyin.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Pomodoro Bot',
          
        },
      };
      setMessages(prevMessages => [errorMessage, ...prevMessages]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider 
      value={{ 
        isVisible, 
        messages, 
        setIsVisible, 
        sendMessage, 
        isTyping,
        clearChat 
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};