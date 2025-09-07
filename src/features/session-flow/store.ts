import { create } from 'zustand';

interface SessionFlowState {
  // Step data
  selectedCafe: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  
  // Generated data
  title: string | null;
  slug: string | null;
  sessionId: string | null;
  
  // Actions
  setCafe: (cafe: string) => void;
  setDate: (date: Date) => void;
  setTime: (time: string) => void;
  setSessionData: (title: string, slug: string, sessionId: string) => void;
  reset: () => void;
}

export const useSessionFlowStore = create<SessionFlowState>((set) => ({
  selectedCafe: null,
  selectedDate: null,
  selectedTime: null,
  title: null,
  slug: null,
  sessionId: null,
  
  setCafe: (cafe) => set({ selectedCafe: cafe }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  setSessionData: (title, slug, sessionId) => set({ title, slug, sessionId }),
  reset: () => set({
    selectedCafe: null,
    selectedDate: null,
    selectedTime: null,
    title: null,
    slug: null,
    sessionId: null,
  }),
}));