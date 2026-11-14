import React, { useState, useMemo } from 'react';
import { SearchInput } from './SearchInput';

export interface ModuleSidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
  countBadge?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
}

export interface ModuleSidebarGroup {
  id?: string;
  title?: string;
  items: ModuleSidebarItem[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface ModuleSidebarProps {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onResetTitle?: () => void;
  resetTitleTooltip?: string;
  subtitle?: React.ReactNode;

  // Search
  search?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  searchId?: string;

  // Navigation Items / Groups
  groups?: ModuleSidebarGroup[];
  items?: ModuleSidebarItem[];
  selectedId?: string;
  onSelectId?: (id: string) => void;

  // Collapse
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;

  // Custom Slots
  footer?: React.ReactNode;
  children?: React.ReactNode;
  hideZeroCountBadges?: boolean;

  className?: string;
  width?: string;
  collapsedWidth?: string;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  title,
  icon,
  onResetTitle,
  resetTitleTooltip = 'Reset to default view',
  subtitle,
  search,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchId,
  groups,
  items,
  selectedId,
  onSelectId,
  isCollapsed = false,
  onToggleCollapse,
  footer,
  children,
  hideZeroCountBadges = false,
  className = '',
  width = 'w-[250px] min-w-[250px]',
  collapsedWidth = 'w-[48px] min-w-[48px]',
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups?.forEach((g) => {
      const key = g.id || g.title || 'group';
      initial[key] = g.defaultExpanded !== false;
    });
    return initial;
  });

  const allNavItems = useMemo(() => {
    if (items && items.length > 0) return items;
    if (groups && groups.length > 0) {
      return groups.flatMap((g) => g.items);
    }
    return [];
  }, [items, groups]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderBadge = (count?: number | string, isActive = false) => {
    if (count === undefined || count === null) return null;
    if (hideZeroCountBadges && count === 0) return null;
    return (
      <span
        className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
          isActive
            ? 'bg-white text-[#C96F55] shadow-2xs'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {count}
      </span>
    );
  };

  return (
    <aside
      className={`${
        isCollapsed ? collapsedWidth : width
      } shrink-0 bg-white border border-gray-200 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col self-stretch overflow-hidden relative select-none box-border transition-all duration-200 ease-in-out ${className}`}
    >
      {/* ── Collapsed Mode ── */}
      {isCollapsed ? (
        <div className="flex flex-col h-full items-center py-2.5 gap-1.5 overflow-y-auto overflow-x-hidden">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold transition-all cursor-pointer text-base select-none shrink-0 mb-1"
              title="Expand sidebar (»)"
              aria-label="Expand sidebar"
            >
              »
            </button>
          )}

          {allNavItems.map((item) => {
            const isActive = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  onSelectId?.(item.id);
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#C96F55] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                {item.icon ? (
                  <span className="shrink-0">{item.icon}</span>
                ) : (
                  <span className="text-xs font-bold">{item.label.slice(0, 1)}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* ── Expanded Normal Mode ── */
        <>
          {/* 1. Top Search Bar */}
          {search !== undefined ? (
            search && <div className="p-3 pb-2 shrink-0">{search}</div>
          ) : onSearchChange ? (
            <div className="p-3 pb-2 shrink-0">
              <SearchInput
                id={searchId}
                size="sm"
                value={searchValue || ''}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                className="bg-white"
              />
            </div>
          ) : null}

          {/* 2. Header Row: Title, Subtitle & Collapse Button */}
          {(title || onToggleCollapse) && (
            <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 shrink-0">
              <div className="min-w-0 flex-1">
                <div
                  className={`flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#C96F55] transition-colors ${
                    onResetTitle ? 'cursor-pointer' : ''
                  }`}
                  onClick={onResetTitle}
                  title={onResetTitle ? resetTitleTooltip : undefined}
                >
                  {icon && (
                    <span className="w-5 h-5 rounded-full bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center text-[10px] shrink-0 font-black">
                      {icon}
                    </span>
                  )}
                  {title && <span className="truncate">{title}</span>}
                </div>
                {subtitle && <div className="mt-0.5">{subtitle}</div>}
              </div>

              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold transition-all cursor-pointer text-sm select-none shrink-0"
                  title="Collapse sidebar («)"
                  aria-label="Collapse sidebar"
                >
                  «
                </button>
              )}
            </div>
          )}

          {/* 3. Navigation List / Groups */}
          <nav className="flex-1 overflow-y-auto px-2 mt-2 pb-6 flex flex-col gap-2">
            {/* Flat items list */}
            {items && (
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const isActive = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        onSelectId?.(item.id);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#C96F55] text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.icon && <span className="shrink-0">{item.icon}</span>}
                        <span className="truncate leading-tight">{item.label}</span>
                      </div>
                      {item.countBadge || renderBadge(item.count, isActive)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grouped items list */}
            {groups &&
              groups.map((group) => {
                const key = group.id || group.title || 'group';
                const isExpanded = expandedGroups[key] !== false;
                const totalCount = group.items.reduce((sum, item) => {
                  const num = typeof item.count === 'number' ? item.count : 0;
                  return sum + num;
                }, 0);

                return (
                  <div key={key} className="flex flex-col">
                    {group.title && (
                      <button
                        type="button"
                        onClick={() => group.isCollapsible !== false && toggleGroup(key)}
                        className={`w-full flex items-center justify-between px-2.5 py-1 text-left rounded-md transition-colors mb-0.5 group ${
                          group.isCollapsible !== false ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                        }`}
                        title={group.isCollapsible !== false ? `Toggle ${group.title} section` : undefined}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {group.isCollapsible !== false && (
                            <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-600 transition-colors">
                              {isExpanded ? '▼' : '►'}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase group-hover:text-slate-700 transition-colors truncate">
                            {group.title}
                          </span>
                        </div>
                        {totalCount > 0 && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {totalCount}
                          </span>
                        )}
                      </button>
                    )}

                    {(!group.title || isExpanded) && (
                      <div className="flex flex-col gap-0.5 pl-1.5">
                        {group.items.map((item) => {
                          const isActive = item.id === selectedId;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                item.onClick?.();
                                onSelectId?.(item.id);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-left text-xs transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#C96F55] text-white font-bold shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {item.icon && <span className="shrink-0">{item.icon}</span>}
                                <span className="truncate leading-tight">{item.label}</span>
                              </div>
                              {item.action || item.countBadge || renderBadge(item.count, isActive)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            {children}

            {/* 4. Footer */}
            {footer && <div className="pt-2 px-1 shrink-0 mt-auto">{footer}</div>}
          </nav>
        </>
      )}
    </aside>
  );
};

export default ModuleSidebar;
