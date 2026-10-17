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
