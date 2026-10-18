import React, { useState } from 'react';
import { Outlet, useLocation, Navigate, NavLink } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../pages/Auth/AuthContext';
import { getStoredToken } from '../services/apiClient';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();
  const token = getStoredToken();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If session verification is in progress, show an accessible loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#faf6f2]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
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
    : 'IA';

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#faf6f2]">
      {/* Mobile Top Header (< 768px) with Hamburger Drawer Trigger */}
      <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-[#0b2239] text-white z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-600/60 text-white font-medium">ITSM</span>
          </div>
        </div>

        <NavLink
          to="/auth"
          className="flex items-center gap-2 text-white/80 hover:text-white"
          title={`${user?.fullName || 'User'} (${user?.role || 'Administrator'})`}
        >
          <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center border border-white/20">
            {initials}
          </div>
        </NavLink>
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
            className="w-full min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppLayout;
