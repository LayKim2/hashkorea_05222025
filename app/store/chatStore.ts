import { create } from 'zustand';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface CollectedInfo {
  location: string | null;
  purpose: string | null;
  preferences: string[] | null;
}

interface ChatStore {
  messages: Message[];
  collectedInfo: CollectedInfo;
  addMessage: (message: Omit<Message, 'timestamp'>) => void;
  clearMessages: () => void;
  initializeStore: () => void;
  updateCollectedInfo: (info: Partial<CollectedInfo>) => void;
  resetCollectedInfo: () => void;
}

// 초기 메시지 템플릿
const INITIAL_MESSAGE_TEMPLATE = {
  id: '1',
  type: 'ai' as const,
  text: 'What kind of place are you looking for?',
};

// 초기 collectedInfo
const INITIAL_COLLECTED_INFO: CollectedInfo = {
  location: null,
  purpose: null,
  preferences: null,
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [], // 초기에는 빈 배열로 시작
  collectedInfo: INITIAL_COLLECTED_INFO,
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, { ...message, timestamp: new Date().toISOString() }] 
  })),
  clearMessages: () => set({ 
    messages: [],
    collectedInfo: INITIAL_COLLECTED_INFO 
  }),
  initializeStore: () => set((state) => {
    // 이미 초기화되어 있다면 아무것도 하지 않음
    if (state.messages.length > 0) return state;
    
    // 초기 메시지 추가
    return {
      messages: [{
        ...INITIAL_MESSAGE_TEMPLATE,
        timestamp: new Date().toISOString()
      }],
      collectedInfo: INITIAL_COLLECTED_INFO
    };
  }),
  updateCollectedInfo: (info) => set((state) => ({
    collectedInfo: { ...state.collectedInfo, ...info }
  })),
  resetCollectedInfo: () => set({ collectedInfo: INITIAL_COLLECTED_INFO }),
})); 