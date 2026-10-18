import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Tag,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  RefreshCw,
  FolderKanban,
  Bookmark,
  Calendar as CalendarIcon,
  Users,
  Database,
  Contact,
  CheckSquare
} from 'lucide-react';

export type ActiveModule =
  | 'dashboard'
  | 'my-work'
  | 'incidents'
  | 'major-incidents'
  | 'problems'
  | 'requests'
  | 'change-requests'
  | 'projects'
  | 'article-drafts'
  | 'calendar'
  | 'organisations'
  | 'cmdb'
  | 'contacts'
  | 'my-approvals';

interface PrimarySidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  activeModule,
  onSelectModule,
}) => {
  const menuItems = [
    { id: 'dashboard' as ActiveModule, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-work' as ActiveModule, label: 'My Work', icon: ClipboardList },
    { id: 'incidents' as ActiveModule, label: 'Incidents', icon: Tag },
    { id: 'major-incidents' as ActiveModule, label: 'Major Incidents', icon: AlertTriangle },
    { id: 'problems' as ActiveModule, label: 'Problems', icon: AlertCircle },
    { id: 'requests' as ActiveModule, label: 'Requests', icon: ShoppingBag },
    { id: 'change-requests' as ActiveModule, label: 'Change Requests', icon: RefreshCw },
    { id: 'projects' as ActiveModule, label: 'Projects', icon: FolderKanban },
    { id: 'article-drafts' as ActiveModule, label: 'Article Drafts', icon: Bookmark },
    { id: 'calendar' as ActiveModule, label: 'Calendar', icon: CalendarIcon },
    { id: 'organisations' as ActiveModule, label: 'Organisations', icon: Users },
    { id: 'cmdb' as ActiveModule, label: 'CMDB', icon: Database },
    { id: 'contacts' as ActiveModule, label: 'Contacts', icon: Contact },
    { id: 'my-approvals' as ActiveModule, label: 'My Approvals', icon: CheckSquare },
  ];

  return (
    <aside className="w-20 bg-[#1B254B] text-slate-300 flex flex-col items-center py-4 select-none shrink-0 border-r border-slate-800">
      {/* Top Profile Avatar for Vooka Sai Siddharth */}
      <div className="mb-6">
        <div className="w-10 h-10 rounded-full bg-[#00bcd4] text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-[#1B254B]">
          VS
        </div>
      </div>

      {/* Navigation Icons Stack */}
      <nav className="flex-1 flex flex-col gap-1.5 w-full px-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={item.label}
              className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-[#00bcd4] text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
              <span className="text-[9px] leading-tight text-center font-medium truncate max-w-full px-0.5">
                {item.label}
              </span>

              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
