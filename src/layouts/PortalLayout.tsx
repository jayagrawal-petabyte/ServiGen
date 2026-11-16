import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../pages/Auth/AuthContext';
import ErrorBoundary from '../components/shared/ErrorBoundary';

export const PortalLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while authenticating
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FFF9F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#C96F55] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading ServiGen...</span>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated visitors to login
  if (!isAuthenticated) {
    const fromPath = `${location.pathname}${location.search}`;
    const toUrl = fromPath ? `/auth?redirect=${encodeURIComponent(fromPath)}` : '/auth';
    return <Navigate to={toUrl} replace />;
  }

  return (
    <div className="min-h-screen w-full bg-[#FFF9F5] flex flex-col overflow-x-hidden">
      <ErrorBoundary resetKey={location.pathname}>
        <React.Suspense
          fallback={
            <div className="flex h-full min-h-[300px] w-full items-center justify-center bg-transparent py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#C96F55] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Loading view...</span>
              </div>
            </div>
          }
        >
          <Outlet />
        </React.Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default PortalLayout;
