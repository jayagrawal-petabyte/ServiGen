import React from 'react';
import LoginScreen from './LoginScreen';
import { LoginCredentials } from './types';

export const AuthPage: React.FC = () => {
  const handleLoginSubmit = (credentials: LoginCredentials) => {
    console.log('Login submitted:', credentials);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      <LoginScreen onLoginSubmit={handleLoginSubmit} />
    </div>
  );
};

export default AuthPage;
