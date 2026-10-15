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
      {/* Top Navigation Switcher */}
      {currentTab !== 'splash' && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: 20,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.92)',
            padding: '5px 8px',
            borderRadius: 24,
            border: '1px solid #E2E8F0',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <button
            type="button"
            style={{
              background: currentTab === 'login' ? '#00D4BB' : 'transparent',
              color: currentTab === 'login' ? '#FFFFFF' : '#475569',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 18,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setCurrentTab('login')}
          >
            Login
          </button>
          <button
            type="button"
            style={{
              background: currentTab === 'users' ? '#00D4BB' : 'transparent',
              color: currentTab === 'users' ? '#FFFFFF' : '#475569',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 18,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setCurrentTab('users')}
          >
            Users List
          </button>
          <button
            type="button"
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 18,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginLeft: 4,
            }}
            onClick={() => navigate('/dashboard')}
          >
            ➔ Enter App
          </button>
        </div>
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
