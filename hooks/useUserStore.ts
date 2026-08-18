// store/useUserStore.ts
import { FriendshipsResponse, MultiOpp, Opportunity, Organization, SignUp, User } from '@/types';
import { create } from 'zustand';

interface PopupMessage {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  opportunityId?: number;
  onClose?: () => void;
}

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
  popup: PopupMessage;
  showPopup: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', opportunityId?: number, onClose?: () => void) => void;
  closePopup: () => void;
  showCarpoolPopup: number | null;
  setShowCarpoolPopup: (id: number | null) => void;
  friendshipsData: FriendshipsResponse | null;
  setFriendshipsData: (data: FriendshipsResponse | null) => void;
  currentUserSignupsSet: Set<number>;
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
  popup: { isOpen: false, title: '', message: '', type: 'info' },
  showPopup: (title, message, type = 'info', opportunityId, onClose) =>
    set({ popup: { isOpen: true, title, message, type, opportunityId, onClose } }),
  closePopup: () =>
    set((state) => ({ popup: { ...state.popup, isOpen: false, onClose: undefined } })),
  showCarpoolPopup: null,
  setShowCarpoolPopup: (id) => set({ showCarpoolPopup: id }),
  friendshipsData: null,
  setFriendshipsData: (data) => set({ friendshipsData: data }),
  currentUserSignupsSet: new Set<number>(),
}));