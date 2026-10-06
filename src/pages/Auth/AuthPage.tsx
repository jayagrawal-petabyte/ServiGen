import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import SplashScreen from './SplashScreen';
import OrganisationUsersScreen from './OrganisationUsersScreen';
import { AuthTab, LoginCredentials } from './types';
import './auth.css';

export const AuthPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AuthTab>('login');
  const [loggedInUser, setLoggedInUser] = useState<string>('Demo');

  const handleLoginSubmit = (credentials: LoginCredentials) => {
    setLoggedInUser(credentials.username || 'Demo');
    setCurrentTab('splash');
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Dev Switcher Bar */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 999,
          display: 'flex',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.9)',
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #334155',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
        }}
      >
        <button
          style={{
            background: currentTab === 'login' ? '#3B82F6' : 'transparent',
            color: '#FFFFFF',
            border: 'none',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTab('login')}
        >
          SCR-001: Login
        </button>
        <button
          style={{
            background: currentTab === 'splash' ? '#00D4BB' : 'transparent',
            color: '#FFFFFF',
            border: 'none',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTab('splash')}
        >
          SCR-013: Splash
        </button>
        <button
          style={{
            background: currentTab === 'users' ? '#8B5CF6' : 'transparent',
            color: '#FFFFFF',
            border: 'none',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTab('users')}
        >
          SCR-020: Users List
        </button>
      </div>

      {currentTab === 'login' && <LoginScreen onLoginSubmit={handleLoginSubmit} />}
      {currentTab === 'splash' && (
        <SplashScreen
          userName={loggedInUser}
          onComplete={() => setCurrentTab('users')}
        />
      )}
      {currentTab === 'users' && <OrganisationUsersScreen />}
    </div>
  );
};

export default AuthPage;

