import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#faf6f2]">
      {/* Figma Dark Navy Left Icon Sidebar */}
      <Sidebar />

      {/* Main Page Viewport */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
