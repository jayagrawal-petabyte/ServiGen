import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from './types';
import { MOCK_ORGANISATION_USERS, PRIMARY_USER } from './mockAuthData';
import { api, setStoredToken, getStoredToken, setStoredUser, getStoredUser, obtainDevAuthToken } from '../../services/apiClient';

interface AuthContextType extends AuthState {
  token: string | null;
  backendConnected: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  switchUser: (userOrId: string | User) => void;
  updateUserRole: (userId: string, newRole: User['role']) => void;
  checkBackendHealth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (backendUser: any): User => {
  const firstName = backendUser.firstName || '';
  const lastName = backendUser.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || backendUser.username || 'User';

  let role: User['role'] = 'Administrator';
  if (backendUser.role === 'Admin') role = 'Administrator';
  else if (backendUser.role === 'Service Agent') role = 'Support Agent';
  else if (backendUser.role === 'Support Team User') role = 'Team Lead';
  else if (backendUser.role === 'Approver') role = 'System Manager';
  else if (backendUser.role === 'Service User') role = 'End User';

  return {
    id: backendUser.id || 'USR-000',
    username: backendUser.username || 'user',
    firstName,
    lastName,
    fullName,
    email: backendUser.email || '',
    phone: backendUser.phone || '+91 98765 43200',
    networkLogin: `CORP\\${backendUser.username || 'user'}`,
    defaultSite: backendUser.siteId || 'Bangalore HQ',
    defaultOrganisation: backendUser.organisationId || 'ServiGen Global Tech',
    region: 'APAC',
    role,
    status: backendUser.active !== false ? 'Active' : 'Inactive',
    lastLogin: 'Just now',
    department: backendUser.department || 'IT Operations',
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedUser = getStoredUser();
    return {
      isAuthenticated: true,
      user: savedUser || PRIMARY_USER,
      loading: false,
      error: null,
    };
  });

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const res = await api.get('/api/health');
      const isOk = res.success === true && res.status === 'ok';
      setBackendConnected(isOk);
      return isOk;
    } catch {
      setBackendConnected(false);
      return false;
    }
  };

  useEffect(() => {
    checkBackendHealth();
    if (!getStoredToken()) {
      obtainDevAuthToken().then((tok) => {
        if (tok) setToken(tok);
      });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Attempt live backend login via /api/auth/login
      const res = await api.post('/api/auth/login', {
        username: credentials.username.trim(),
        password: credentials.password,
      });

      const authToken = res.token || res.data?.token;
      if (res.success && authToken) {
        const normalized = normalizeUser(res.data || res);
        setStoredToken(authToken);
        setStoredUser(normalized);
        setToken(authToken);
        setBackendConnected(true);
        setAuthState({
          isAuthenticated: true,
          user: normalized,
          loading: false,
          error: null,
        });
        return true;
      }
    } catch (err) {
      console.warn('Backend login attempt encountered an issue, testing mock fallback:', err);
    }

    // 2. Fallback to mock organization users for offline/local resilience
    const foundUser = MOCK_ORGANISATION_USERS.find(
      (u) =>
        u.username.toLowerCase() === credentials.username.trim().toLowerCase() ||
        u.email.toLowerCase() === credentials.username.trim().toLowerCase()
    );

    if (foundUser) {
      const devTok = await obtainDevAuthToken();
      if (devTok) {
        setStoredToken(devTok);
        setToken(devTok);
      }
      setStoredUser(foundUser);
      setAuthState({
        isAuthenticated: true,
        user: foundUser,
        loading: false,
        error: null,
      });
      return true;
    }

    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: 'Invalid username or password.',
    });
    return false;
  };

  const logout = () => {
    setStoredToken(null);
    setStoredUser(null);
    setToken(null);
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  };

  const switchUser = (userOrId: string | User) => {
    if (typeof userOrId === 'object' && userOrId !== null) {
      setStoredUser(userOrId);
      setAuthState({
        isAuthenticated: true,
        user: userOrId,
        loading: false,
        error: null,
      });
      return;
    }
    const found = MOCK_ORGANISATION_USERS.find(
      (u) =>
        u.id === userOrId ||
        u.fullName.toLowerCase() === userOrId.toLowerCase() ||
        u.username.toLowerCase() === userOrId.toLowerCase()
    );
    if (found) {
      setStoredUser(found);
      setAuthState({
        isAuthenticated: true,
        user: found,
        loading: false,
        error: null,
      });
    }
  };

  const updateUserRole = (userId: string, newRole: User['role']) => {
    if (authState.user && (authState.user.id === userId || authState.user.username === userId)) {
      const updatedUser = { ...authState.user, role: newRole };
      setStoredUser(updatedUser);
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        token,
        backendConnected,
        login,
        logout,
        switchUser,
        updateUserRole,
        checkBackendHealth,
      }}
    >
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
