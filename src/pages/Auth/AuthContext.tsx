import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from './types';
import { api, setStoredToken, getStoredToken, setStoredUser, getStoredUser } from '../../services/apiClient';

interface AuthContextType extends AuthState {
  token: string | null;
  backendConnected: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  switchUser: (user: User) => void;
  updateUserRole: (userId: string, newRole: User['role']) => void;
  checkBackendHealth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const normalizeUser = (backendUser: any): User => {
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
    phone: backendUser.phone || backendUser.phoneNumber || '+91 98765 43200',
    networkLogin: backendUser.networkLogin || `CORP\\${backendUser.username || 'user'}`,
    defaultSite: backendUser.site?.name || backendUser.siteId || 'Bangalore HQ',
    defaultOrganisation: backendUser.organisation?.name || backendUser.organisationId || 'ServiGen Global Tech',
    region: 'APAC',
    role,
    status: backendUser.active !== false && backendUser.availability !== 'Inactive' ? 'Active' : 'Inactive',
    lastLogin: 'Just now',
    department: backendUser.department || 'IT Operations',
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedUser = getStoredUser();
    const savedToken = getStoredToken();
    return {
      isAuthenticated: Boolean(savedUser && savedToken),
      user: savedUser || null,
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
    
    // Sync active session with backend API if a token exists (GET /api/auth/session)
    const activeToken = getStoredToken();
    if (activeToken) {
      api.get('/api/auth/session')
        .then((res) => {
          const sessionUser = res?.data || res;
          if (sessionUser && (sessionUser.id || sessionUser.username)) {
            const normalized = normalizeUser(sessionUser);
            setStoredUser(normalized);
            setAuthState({
              isAuthenticated: true,
              user: normalized,
              loading: false,
              error: null,
            });
            setBackendConnected(true);
          }
        })
        .catch(() => {
          // If session is expired or invalid on the backend, clear session
          setBackendConnected(false);
        });
    }
  }, []);

  /**
   * Authenticate strictly against live backend endpoint (POST /api/auth/login)
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await api.post('/api/auth/login', {
        username: credentials.username.trim(),
        password: credentials.password,
      });

      const authToken = res.token || res.data?.token;
      if (res.success && authToken) {
        const backendUserData = res.data?.user || res.data || res;
        const normalized = normalizeUser(backendUserData);
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

      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: res.message || 'Invalid username or password.',
      });
      return false;
    } catch (err: any) {
      const msg = err.message || 'Invalid username or password.';
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: msg,
      });
      return false;
    }
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

  const switchUser = (user: User) => {
    if (user && typeof user === 'object') {
      setStoredUser(user);
      setAuthState({
        isAuthenticated: true,
        user,
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
