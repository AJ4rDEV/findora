import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, LanguageCode, ThemeMode } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  register: (fullName: string, email: string, pass: string, lang?: LanguageCode, theme?: ThemeMode) => Promise<UserProfile>;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot';
  openAuthModal: (mode?: 'login' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (
    fullName: string,
    email: string,
    pass: string,
    lang?: LanguageCode,
    theme?: ThemeMode
  ) => {
    const profile = await authService.registerUser(fullName, email, pass, lang, theme);
    setUser(profile);
    setAuthModalOpen(false);
    return profile;
  };

  const login = async (email: string, pass: string) => {
    const profile = await authService.loginUser(email, pass);
    setUser(profile);
    setAuthModalOpen(false);
    return profile;
  };

  const logout = async () => {
    await authService.logoutUser();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');
    const updated = await authService.updateUserProfile(user.uid, updates);
    setUser(updated);
    return updated;
  };

  const openAuthModal = (mode: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        resetPassword,
        updateProfile,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
