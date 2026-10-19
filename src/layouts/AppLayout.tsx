import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../pages/Auth/AuthContext';
import { getStoredToken } from '../services/apiClient';
import BackendStatusBanner from '../components/shared/BackendStatusBanner';
import ErrorBoundary from '../components/shared/ErrorBoundary';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const token = getStoredToken();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [presence, setPresence] = useState<'available' | 'away' | 'busy'>(() => {
    try {
      const saved = localStorage.getItem('servigen_agent_presence');
      if (saved === 'away' || saved === 'busy' || saved === 'available') return saved;
    } catch {}
    return 'available';
  });

  const handleSetPresence = (newPresence: 'available' | 'away' | 'busy') => {
    setPresence(newPresence);
    try {
      localStorage.setItem('servigen_agent_presence', newPresence);
      window.dispatchEvent(new CustomEvent('servigen-presence-change', { detail: newPresence }));
    } catch (e) {
      console.warn('Failed to save presence:', e);
    }
  };

  useEffect(() => {
    const handlePresenceEvent = (e: any) => {
      if (e?.detail && ['available', 'away', 'busy'].includes(e.detail)) {
        setPresence(e.detail);
      }
    };
    window.addEventListener('servigen-presence-change', handlePresenceEvent);
    return () => window.removeEventListener('servigen-presence-change', handlePresenceEvent);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // If session verification is in progress, show an accessible loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#faf6f2]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#eb6a47] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Authenticating ServiGen...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AA';

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#faf6f2]">
      {/* Mobile Top Header (< 768px) with Hamburger Drawer Trigger */}
      <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-[#0b2239] text-white z-40 shrink-0 shadow-sm relative">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMobileSidebarOpen((prev) => !prev);
              setProfileMenuOpen(false);
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-white">ServiGen</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eb6a47]/70 text-white font-medium">ITSM</span>
          </div>
        </div>

        {/* Mobile Profile Trigger & Flyout */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen((prev) => !prev);
              setMobileSidebarOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-[#eb6a47] text-white font-bold text-xs flex items-center justify-center border border-white/20 hover:bg-[#d28072] cursor-pointer transition-colors relative"
            title={`Signed in as ${user?.fullName || 'Adam Admin'} (${presence})`}
            aria-label="User Profile"
          >
            {initials}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0b2239] ${
                presence === 'available'
                  ? 'bg-emerald-500'
                  : presence === 'away'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </button>

          {/* Mobile Profile Dropdown Flyout */}
          {profileMenuOpen && (
            <>
              {/* Overlay to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs"
                onClick={() => setProfileMenuOpen(false)}
                aria-hidden="true"
              />

              <div
                className="absolute right-0 top-11 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#1c2b3d] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {user?.fullName || ''}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user?.email || ''}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#fff5f2] text-[#eb6a47] border border-[#f7c9bc]">
                      {user?.role || 'Administrator'}
                    </span>
                  </div>
                </div>

                {/* Agent Presence Status */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    Agent Presence
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleSetPresence('available')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        presence === 'available'
                          ? 'bg-white text-emerald-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresence('away')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        presence === 'away'
                          ? 'bg-white text-amber-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Away
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresence('busy')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        presence === 'busy'
                          ? 'bg-white text-rose-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Busy
                    </button>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/my-work');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                  >
                    <span>📋</span>
                    <span>My Work & Tasks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/organisations');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                  >
                    <span>🏢</span>
                    <span>Organisation & Sites</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                  >
                    <span>📊</span>
                    <span>ITSM Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (logout) logout();
                      navigate('/auth');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-left mt-1 border-t border-slate-100"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Backdrop Overlay (< 768px) */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Icon Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Page Viewport */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-full flex-1 flex flex-col"
          >
            <ErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppLayout;
