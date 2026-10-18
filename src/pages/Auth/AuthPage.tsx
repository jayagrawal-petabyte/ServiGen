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

  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetSubmitted, setResetSubmitted] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleLoginSubmit = async (credentials: LoginCredentials): Promise<boolean> => {
    const success = await login(credentials);
    if (success) {
      setLoggedInUser(credentials.username || 'Demo');
      setCurrentTab('splash');
      return true;
    }
    return false;
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      setResetError('Please enter your email or username.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setTimeout(() => {
      setResetLoading(false);
      setResetSubmitted(true);
    }, 600);
  };

  const handleCloseResetModal = () => {
    setShowForgotPassword(false);
    setResetSubmitted(false);
    setResetIdentifier('');
    setResetError(null);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      {currentTab === 'login' && (
        <LoginScreen
          onLoginSubmit={handleLoginSubmit}
          onForgotPasswordClick={() => setShowForgotPassword(true)}
        />
      )}
      {currentTab === 'splash' && (
        <SplashScreen
          userName={loggedInUser}
          onComplete={() => navigate('/dashboard')}
        />
      )}
      {currentTab === 'users' && <OrganisationUsersScreen />}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={handleCloseResetModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseResetModal}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            {!resetSubmitted ? (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 font-bold text-sm">
                    🔑
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Reset Your Password</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your ServiGen username or registered email address. We'll send you a secure link to reset your credentials.
                </p>

                {resetError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    value={resetIdentifier}
                    onChange={(e) => {
                      setResetIdentifier(e.target.value);
                      if (resetError) setResetError(null);
                    }}
                    placeholder="e.g. admin or support@servigen.io"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseResetModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-3 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xl font-bold flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h3 className="text-base font-bold text-slate-900">Check Your Inbox</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  If an active ServiGen account matches <strong className="text-slate-800">{resetIdentifier}</strong>, a password reset link has been dispatched.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseResetModal}
                    className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
