// store/useUserStore.ts
import { create } from 'zustand';
import { User } from '../types';

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  clearCurrentUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  updateCurrentUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
    })),
  clearCurrentUser: () => set({ currentUser: null }),
}));