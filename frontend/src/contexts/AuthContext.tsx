// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/UseAuth';
import { ActorData } from '../../../types/api';

interface AuthContextType {
  currentUser: ActorData | null;
  loading: boolean;
  getCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
