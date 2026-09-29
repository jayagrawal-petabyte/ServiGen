import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import SplashScreen from './SplashScreen';
import { AuthTab, LoginCredentials } from './types';

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
          gap: 8,
          background: 'rgba(30, 41, 59, 0.85)',
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid #334155',
          backdropFilter: 'blur(6px)',
        }}
      >
        <button
          style={{
            background: currentTab === 'login' ? '#00C4FF' : 'transparent',
            color: currentTab === 'login' ? '#0f172a' : '#94a3b8',
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
            color: currentTab === 'splash' ? '#0f172a' : '#94a3b8',
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
      </div>

      {currentTab === 'login' && <LoginScreen onLoginSubmit={handleLoginSubmit} />}
      {currentTab === 'splash' && (
        <SplashScreen
          userName={loggedInUser}
          onComplete={() => setCurrentTab('login')}
        />
      )}
    </div>
  );
};

export default AuthPage;
