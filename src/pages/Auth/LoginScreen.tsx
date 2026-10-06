import React, { useState } from 'react';
import { LoginCredentials } from './types';
import './auth.css';

export interface LoginScreenProps {
  onLoginSubmit?: (credentials: LoginCredentials) => void;
  onForgotPasswordClick?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSubmit,
  onForgotPasswordClick,
}) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Field validation - SG-10 compliant (no console.log of passwords or credentials)
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setErrorMessage('Please enter both User Name and Password.');
      return;
    }

    setLoading(true);

    if (onLoginSubmit) {
      onLoginSubmit(credentials);
    } else {
      // SG-10 compliant: No fake alert() or credential logging
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  return (
    <div className="figma-login-page">
      {/* Central Organic Shape SVG matching Figma screenshot */}
      <svg
        className="figma-svg-bg"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 230 0 C 80 180, 70 520, 260 700 L 780 700 C 930 520, 920 160, 730 0 Z"
          fill="#FFFBF8"
        />
      </svg>

      {/* Decorative Dots & Shapes matching Figma screenshot */}
      <div className="figma-decor-layer">
        <div className="decor-dot-1" />
        <div className="decor-dot-2" />
        <div className="decor-dot-3" />
        <div className="decor-dot-4" />
        <div className="decor-dot-5" />
        <div className="decor-capsule-6" />
        <div className="decor-dot-7" />
        <div className="decor-dot-8" />
      </div>

      {/* Login Card Area */}
      <div className="figma-login-wrapper">
        <h1 className="figma-login-header">Login</h1>

        <div className="figma-card-box">
          {errorMessage && <div className="figma-error-msg">{errorMessage}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* User Name */}
            <div className="figma-field">
              <label className="figma-field-label" htmlFor="username">
                User Name
              </label>
              <input
                id="username"
                type="text"
                className="figma-input-field"
                value={credentials.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('username', e.target.value)
                }
                autoComplete="username"
              />
            </div>

            {/* Password with Visibility Toggle */}
            <div className="figma-field">
              <label className="figma-field-label" htmlFor="password">
                Password
              </label>
              <div className="figma-password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="figma-input-field"
                  value={credentials.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('password', e.target.value)
                  }
                  autoComplete="current-password"
                />
                <button
  type="button"
  className="figma-eye-btn"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? 'Hide password' : 'Show password'}
>
  {showPassword ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.1A10.8 10.8 0 0 1 12 5c7 0 10 7 10 7a18.5 18.5 0 0 1-3.1 4.3M6.1 6.1C3.4 8.1 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )}
</button>
              </div>
            </div>

            {/* Login Button */}
            <div className="figma-btn-row">
              <button type="submit" className="figma-submit-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>

        {/* Forget Password Link */}
        <div className="figma-forget-row">
          <a
            className="figma-forget-text"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              if (onForgotPasswordClick) {
                onForgotPasswordClick();
              }
            }}
          >
            Forget Password
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
