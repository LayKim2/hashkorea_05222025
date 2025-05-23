import { create } from 'zustand';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface ChatStore {
  messages: Message[];
  addMessage: (message: Omit<Message, 'timestamp'>) => void;
  clearMessages: () => void;
  initializeStore: () => void;
}

// 초기 메시지 템플릿
const INITIAL_MESSAGE_TEMPLATE = {
  id: '1',
  type: 'ai' as const,
  text: 'Hello! I am Hash Korea AI Assistant. What kind of place are you looking for?',
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [], // 초기에는 빈 배열로 시작
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, { ...message, timestamp: new Date().toISOString() }] 
  })),
  clearMessages: () => set({ messages: [] }),
  initializeStore: () => set((state) => {
    // 이미 초기화되어 있다면 아무것도 하지 않음
    if (state.messages.length > 0) return state;
    
    // 초기 메시지 추가
    return {
      messages: [{
        ...INITIAL_MESSAGE_TEMPLATE,
        timestamp: new Date().toISOString()
      }]
    };
  }),
})); 