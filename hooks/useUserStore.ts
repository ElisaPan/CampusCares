// store/useUserStore.ts
import { create } from 'zustand';
import { MultiOpp, Opportunity, Organization, SignUp, User } from '../types';

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  clearCurrentUser: () => void;
  students: User[];
  setStudents: (students: User[]) => void;
  signups: SignUp[];
  setSignups: (signups: SignUp[]) => void;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  allOpps: (Opportunity | MultiOpp)[];
  setAllOpps: (opps: (Opportunity | MultiOpp)[]) => void;
  addOpp: (opp: Opportunity | MultiOpp) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  updateCurrentUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
    })),
  clearCurrentUser: () => set({ currentUser: null }),
  students: [],
  setStudents: (students) => set({ students }),
  signups: [],
  setSignups: (signups) => set({ signups }),
  organizations: [],
  setOrganizations: (orgs) => set({ organizations: orgs }),
  allOpps: [],
  setAllOpps: (opps) => set({ allOpps: opps }),
  addOpp: (opp) => set((state) => ({ allOpps: [...state.allOpps, opp] })),
}));