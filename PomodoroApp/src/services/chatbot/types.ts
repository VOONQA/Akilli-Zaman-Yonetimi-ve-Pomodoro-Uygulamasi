export interface ChatMessage {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
    avatar?: string;
  };
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface ChatContextValue {
  state: ChatState;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}
