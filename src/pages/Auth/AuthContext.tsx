import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from './types';
import { MOCK_ORGANISATION_USERS, PRIMARY_USER } from './mockAuthData';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  switchUser: (userIdOrFullName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: true,
    user: PRIMARY_USER,
    loading: false,
    error: null,
  });

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    // SG-10 compliant: Never console.log credentials or passwords
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = MOCK_ORGANISATION_USERS.find(
          (u) =>
            u.username.toLowerCase() === credentials.username.toLowerCase() ||
            u.email.toLowerCase() === credentials.username.toLowerCase()
        );

        if (foundUser) {
          setAuthState({
            isAuthenticated: true,
            user: foundUser,
            loading: false,
            error: null,
          });
          resolve(true);
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: 'Invalid username or password.',
          });
          resolve(false);
        }
      }, 600);
    });
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  };

  const switchUser = (userIdOrFullName: string) => {
    const found = MOCK_ORGANISATION_USERS.find(
      (u) =>
        u.id === userIdOrFullName ||
        u.fullName.toLowerCase() === userIdOrFullName.toLowerCase() ||
        u.username.toLowerCase() === userIdOrFullName.toLowerCase()
    );
    if (found) {
      setAuthState({
        isAuthenticated: true,
        user: found,
        loading: false,
        error: null,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
