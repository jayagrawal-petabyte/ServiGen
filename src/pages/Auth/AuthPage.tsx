import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginScreen from './LoginScreen';
import SplashScreen from './SplashScreen';
import OrganisationUsersScreen from './OrganisationUsersScreen';
import { AuthTab, LoginCredentials } from './types';
import { useAuth } from './AuthContext';
import './auth.css';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const initialTab: AuthTab = searchParams.get('tab') === 'users' ? 'users' : 'login';
  const [currentTab, setCurrentTab] = useState<AuthTab>(initialTab);
  const [loggedInUser, setLoggedInUser] = useState<string>('Demo');

  const handleLoginSubmit = async (credentials: LoginCredentials): Promise<boolean> => {
    const success = await login(credentials);
    if (success) {
      setLoggedInUser(credentials.username || 'Demo');
      setCurrentTab('splash');
      return true;
    }
    return false;
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Discrete Enter App button on Login screen */}
      {currentTab === 'login' && (
        <button
          type="button"
          style={{
            position: 'fixed',
            top: 20,
            right: 24,
            zIndex: 50,
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onClick={() => navigate('/dashboard')}
        >
          ➔ Enter App
        </button>
      )}

      {currentTab === 'login' && <LoginScreen onLoginSubmit={handleLoginSubmit} />}
      {currentTab === 'splash' && (
        <SplashScreen
          userName={loggedInUser}
          onComplete={() => navigate('/dashboard')}
        />
      )}
      {currentTab === 'users' && <OrganisationUsersScreen />}
    </div>
  );
};

export default AuthPage;
