import React from 'react';
import { Bell, Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  onNewTicketClick?: () => void;
  onGetStartedClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewTicketClick,
  onGetStartedClick,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-end gap-3 shrink-0 select-none">
      {/* Get Started Button */}
      <button
        onClick={onGetStartedClick}
        className="px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-[#00bcd4] font-bold text-xs rounded-full transition-colors flex items-center gap-1.5 cursor-pointer border border-cyan-100"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#00bcd4]" />
        <span>Get started</span>
      </button>

      {/* New Ticket Button */}
      <button
        onClick={onNewTicketClick}
        className="px-4 py-2 bg-[#00bcd4] hover:bg-[#00a2b8] text-white font-bold text-xs rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>New Ticket</span>
      </button>

      {/* Notification Bells */}
      <div className="flex items-center gap-1.5 ml-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            key={item}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
          </button>
        ))}
      </div>

      {/* User Avatar Circle */}
      <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center font-bold text-sm text-[#00bcd4] ml-2 shadow-xs cursor-pointer" title="Vooka Sai Siddharth">
        VS
      </div>
    </header>
  );
};
