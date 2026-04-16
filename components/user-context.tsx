import { User } from '@/types';
import { createContext, useContext } from 'react';

type UserContextType = {
  students: User[];
  currentUser: User | null;
};

const UserContext = createContext<UserContextType>({
  students: [],
  currentUser: null,
});

export const useUserData = () => useContext(UserContext);

export default UserContext;