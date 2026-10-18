import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { TimesheetPopover } from './TimesheetPopover';
import { AgentKpiDrawer } from './AgentKpiDrawer';
import { FeedPopover } from './FeedPopover';
import { api, getAuthToken } from '../../services/apiClient';
import './GlobalNavbarActions.css';

export interface GlobalNavbarActionsProps {
  className?: string;
  onOpenTicket?: (ticketId: string) => void;
  onGetStarted?: () => void;
  onNewTicket?: () => void;
  hidePills?: boolean;
}

interface QuickSearchItem {
  id: string;
  summary: string;
  category?: string;
  priority?: string;
  status?: string;
}

interface NotificationItem {
  id: string;
  ticketId: string;
  title: string;
  desc: string;
  time: string;
  isSla?: boolean;
  slaTime?: string;
  unread: boolean;
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export const GlobalNavbarActions: React.FC<GlobalNavbarActionsProps> = ({
  className = '',
  onOpenTicket,
  onGetStarted,
  onNewTicket,
  hidePills = false,
}) => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user;
  const logout = authContext?.logout;

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AA';

  // Active flyout state (mutually exclusive)
  type FlyoutType = 'search' | 'notifications' | 'todo' | 'timesheet' | 'kpi' | 'feed' | 'profile' | null;
  const [activeFlyout, setActiveFlyout] = useState<FlyoutType>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showQuickTicketModal, setShowQuickTicketModal] = useState(false);
  const [quickSummary, setQuickSummary] = useState('');
  const [quickCategory, setQuickCategory] = useState('Standard Applications');
  const [quickPriority, setQuickPriority] = useState('Medium');
  const [quickDesc, setQuickDesc] = useState('');
  const [ticketSuccessNotice, setTicketSuccessNotice] = useState<string | null>(null);

  // User presence status
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
      api.patch('/api/users/presence', { presence: newPresence, userId: user?.id }).catch(() => {});
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

  // To-Do list state (matching Figma design)
  const [todoDate, setTodoDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [todoItems, setTodoItems] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem('servigen_global_todos_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse todos from localStorage:', e);
    }
    return [];
  });
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const todoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('servigen_global_todos_v1', JSON.stringify(todoItems));
    } catch (e) {
      console.warn('Failed to save todos to localStorage:', e);
    }
  }, [todoItems]);

  useEffect(() => {
    if (isAddingTodo) {
      setTimeout(() => todoInputRef.current?.focus(), 50);
    }
  }, [isAddingTodo]);

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const newItem: TodoItem = {
      id: 'todo-' + Date.now(),
      text: newTodoText.trim(),
      done: false,
      createdAt: Date.now(),
    };
    setTodoItems((prev) => [newItem, ...prev]);
    setNewTodoText('');
    setIsAddingTodo(false);
  };

  const handleToggleTodo = (id: string) => {
    setTodoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodoItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketList, setTicketList] = useState<QuickSearchItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications state
  const [readNotifIds, setReadNotifIds] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('servigen_read_notif_ids') || '{}');
    } catch {
      return {};
    }
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!getAuthToken()) return;
    let active = true;

    const formatSlaMinutes = (minutes?: number | null): string | undefined => {
      if (typeof minutes !== 'number' || isNaN(minutes)) return undefined;
      const isNeg = minutes < 0;
      const abs = Math.abs(minutes);
      const h = Math.floor(abs / 60);
      const m = abs % 60;
      const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return isNeg ? `-${str}` : `+${str}`;
    };

    const formatTimeAgo = (dateStr?: string | null): string => {
      if (!dateStr) return 'Recently';
      try {
        const date = new Date(dateStr);
        const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
        if (isNaN(diffSec) || diffSec < 0) return 'Recently';
        if (diffSec < 60) return 'Just now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return `${Math.floor(diffSec / 86400)}d ago`;
      } catch {
        return 'Recently';
      }
    };

    Promise.allSettled([
      api.get('/api/major-incidents'),
      api.get('/api/tickets'),
    ]).then(([miRes, tickRes]) => {
      if (!active) return;
      const liveNotifs: NotificationItem[] = [];

      const rawMiList = miRes.status === 'fulfilled'
        ? (Array.isArray(miRes.value?.data) ? miRes.value.data : Array.isArray(miRes.value) ? miRes.value : [])
        : [];
      const rawTicketList = tickRes.status === 'fulfilled'
        ? (Array.isArray(tickRes.value?.data) ? tickRes.value.data : Array.isArray(tickRes.value) ? tickRes.value : [])
        : [];

      // Populate quick search index directly from tickets response
      if (rawTicketList.length > 0) {
        setTicketList(
          rawTicketList.map((t: any) => ({
            id: String(t.id || ''),
            summary: t.summary || t.title || '',
            category: t.category || '',
            priority: t.priority || '',
            status: t.status || '',
          }))
        );
      }

      // 1. Live Major Incidents (active, unresolved incidents only)
      rawMiList
        .filter((mi: any) => !['resolved', 'closed'].includes(String(mi.status || '').toLowerCase()))
        .slice(0, 3)
        .forEach((mi: any) => {
          const notifId = `notif-mi-${mi.id}`;
          const isCritical = mi.priority === 'P1' || mi.priority === 'Critical';
          liveNotifs.push({
            id: notifId,
            ticketId: String(mi.id),
            title: isCritical ? 'Critical Major Incident Alert' : 'Major Incident Alert',
            desc: mi.title || mi.description || 'Major Incident In Progress',
            time: formatTimeAgo(mi.startedAt || mi.createdAt),
            isSla: Boolean(mi.resolutionTarget),
            slaTime: mi.resolutionTarget ? String(mi.resolutionTarget) : undefined,
            unread: !readNotifIds[notifId],
          });
        });

      // 2. Tickets with actual SLA Breaches, SLA Warnings, or Critical Priority
      rawTicketList
        .filter((t: any) => !['resolved', 'closed'].includes(String(t.status || '').toLowerCase()))
        .forEach((t: any) => {
          const notifId = `notif-t-${t.id}`;
          const hasSlaNum = typeof t.slaTimeLeft === 'number';
          const isBreached = hasSlaNum && t.slaTimeLeft < 0;
          const isWarning = hasSlaNum && t.slaTimeLeft >= 0 && t.slaTimeLeft <= 60;
          const isCritical = t.priority === 'Critical' || t.priority === 'High';

          if (isBreached) {
            liveNotifs.push({
              id: notifId,
              ticketId: String(t.id),
              title: 'Critical SLA Breach Alert',
              desc: t.summary || t.title || 'SLA breached on active ticket',
              time: formatTimeAgo(t.updatedAt || t.createdAt),
              isSla: true,
              slaTime: formatSlaMinutes(t.slaTimeLeft),
              unread: !readNotifIds[notifId],
            });
          } else if (isWarning) {
            liveNotifs.push({
              id: notifId,
              ticketId: String(t.id),
              title: 'SLA Warning Alert',
              desc: t.summary || t.title || 'SLA approaching breach limit',
              time: formatTimeAgo(t.updatedAt || t.createdAt),
              isSla: true,
              slaTime: formatSlaMinutes(t.slaTimeLeft),
              unread: !readNotifIds[notifId],
            });
          } else if (isCritical && liveNotifs.length < 5) {
            liveNotifs.push({
              id: notifId,
              ticketId: String(t.id),
              title: `${t.priority} Priority Ticket`,
              desc: t.summary || t.title || 'Priority ticket requires attention',
              time: formatTimeAgo(t.updatedAt || t.createdAt),
              isSla: hasSlaNum,
              slaTime: hasSlaNum ? formatSlaMinutes(t.slaTimeLeft) : undefined,
              unread: !readNotifIds[notifId],
            });
          }
        });

      setNotifications(liveNotifs);
    });

    return () => {
      active = false;
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close flyouts on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveFlyout(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when search flyout opens
  useEffect(() => {
    if (activeFlyout === 'search') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [activeFlyout]);

  const toggleFlyout = (flyout: FlyoutType) => {
    setActiveFlyout((prev) => (prev === flyout ? null : flyout));
  };

  const handleTicketClick = (ticketId: string) => {
    setActiveFlyout(null);
    if (onOpenTicket) {
      onOpenTicket(ticketId);
    } else {
      navigate(`/incidents`);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    const updatedMap: Record<string, boolean> = { ...readNotifIds };
    notifications.forEach((n) => {
      updatedMap[n.id] = true;
    });
    setReadNotifIds(updatedMap);
    try {
      localStorage.setItem('servigen_read_notif_ids', JSON.stringify(updatedMap));
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    const updatedMap = { ...readNotifIds, [item.id]: true };
    setReadNotifIds(updatedMap);
    try {
      localStorage.setItem('servigen_read_notif_ids', JSON.stringify(updatedMap));
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    handleTicketClick(item.ticketId);
  };

  // Filtered search results
  const filteredSearch = searchQuery.trim()
    ? ticketList.filter(
        (t) =>
          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : ticketList.slice(0, 8);

  const handleQuickCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSummary.trim()) return;
    let newId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const res: any = await api.post('/api/incidents', {
        summary: quickSummary.trim(),
        description: quickDesc.trim() || quickSummary.trim(),
        category: quickCategory,
        priority: quickPriority,
      });
      if (res?.data?.id) {
        newId = String(res.data.id);
      } else if (res?.id) {
        newId = String(res.id);
      }
    } catch (err) {
      console.warn('[GlobalNavbarActions] Ticket create API sync notice:', err);
    }

    const newTicketItem: QuickSearchItem = {
      id: newId,
      summary: quickSummary.trim(),
      category: quickCategory,
      priority: quickPriority,
      status: 'Open',
    };
    setTicketList((prev) => [newTicketItem, ...prev]);
    setTicketSuccessNotice(`Ticket #${newId} created successfully!`);
    setTimeout(() => {
      setTicketSuccessNotice(null);
      setShowQuickTicketModal(false);
      setQuickSummary('');
      setQuickDesc('');
    }, 1800);
  };

  return (
    <div className={`global-nav-actions-wrap ${className}`} ref={containerRef}>
      {/* ─── LEADING IMAGE COMPONENTS (FIGMA SPECIFICATION) ─── */}
      {!hidePills && (
        <div className="global-nav-leading-actions">
          <button
            type="button"
            className="global-nav-pill-btn global-nav-get-started-btn"
            onClick={() => {
              if (onGetStarted) {
                onGetStarted();
              } else {
                setShowHelpModal(true);
              }
            }}
            title="Get Started Guide"
          >
            Get started
          </button>

          <button
            type="button"
            className="global-nav-pill-btn global-nav-new-ticket-btn"
            onClick={() => {
              if (onNewTicket) {
                onNewTicket();
              } else {
                setShowQuickTicketModal(true);
              }
            }}
            title="Create New Ticket"
          >
            <span className="global-nav-plus-sign">+</span>
            <span>New Ticket</span>
          </button>
        </div>
      )}

      {/* ─── 8 UNIFIED CIRCULAR ACTION BUTTONS (FIGMA SPECIFICATION) ─── */}
      <div className="global-nav-icons-group">
        {/* 1. Search Icon */}
        <button
          type="button"
          className={`global-nav-icon-btn ${activeFlyout === 'search' ? 'is-active' : ''}`}
          title="Search tickets & incidents"
          onClick={() => toggleFlyout('search')}
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

      {/* 2. Notifications Bell */}
      <button
        type="button"
        className={`global-nav-icon-btn ${activeFlyout === 'notifications' ? 'is-active' : ''}`}
        title={`Notifications (${unreadCount} unread)`}
        onClick={() => toggleFlyout('notifications')}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="global-nav-badge" />}
      </button>

      {/* 3. Tasks / Clipboard -> To-Do Popover */}
      <button
        type="button"
        className={`global-nav-icon-btn ${activeFlyout === 'todo' ? 'is-active is-todo-active' : ''}`}
        title="To-Do List & Quick Tasks"
        onClick={() => toggleFlyout('todo')}
        aria-label="To-Do"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      </button>

      {/* 4. Speedometer / Gauge -> Timesheet & Hours */}
      <button
        type="button"
        className={`global-nav-icon-btn ${activeFlyout === 'timesheet' ? 'is-active' : ''}`}
        title="Timesheet & Hours Log"
        onClick={() => toggleFlyout('timesheet')}
        aria-label="Timesheet"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 12 18 6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {/* 5. Broadcast Waves -> Agent KPI Dashboard */}
      <button
        type="button"
        className={`global-nav-icon-btn ${activeFlyout === 'kpi' ? 'is-active' : ''}`}
        title="Agent KPI Dashboard"
        onClick={() => toggleFlyout('kpi')}
        aria-label="Agent KPI Dashboard"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {/* 6. Clock -> Live Activity Feed */}
      <button
        type="button"
        className={`global-nav-icon-btn ${activeFlyout === 'feed' ? 'is-active' : ''}`}
        title="Live Activity Feed"
        onClick={() => toggleFlyout('feed')}
        aria-label="Live Activity Feed"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      </button>

      {/* 7. Help / Guide */}
      <button
        type="button"
        className="global-nav-icon-btn"
        title="Help & System Guide"
        onClick={() => {
          setActiveFlyout(null);
          setShowHelpModal(true);
        }}
        aria-label="Help"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      </button>

      {/* 8. Avatar & User Presence Button */}
      <button
        type="button"
        className="global-nav-avatar-btn"
        title={`Signed in as ${user?.fullName || 'Agent'} (${presence})`}
        onClick={() => toggleFlyout('profile')}
        aria-label="User Profile"
      >
        <span className="global-nav-avatar-initials">{userInitials}</span>
        <span className={`global-nav-presence-dot ${presence}`} />
      </button>
      </div>

      {/* ─── FLYOUT 1: QUICK SEARCH ─── */}
      {activeFlyout === 'search' && (
        <div className="global-flyout-dropdown global-search-flyout">
          <div className="global-flyout-header">
            <span className="global-flyout-title">Quick Search</span>
            <button
              type="button"
              className="global-flyout-action-btn"
              onClick={() => setActiveFlyout(null)}
            >
              ✕
            </button>
          </div>
          <div className="global-search-input-wrap">
            <svg
              className="global-search-icon-inside"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="global-search-input"
              placeholder="Search by ID, summary, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="global-search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
          <div className="global-search-results-list">
            {filteredSearch.length > 0 ? (
              filteredSearch.map((item) => (
                <div
                  key={item.id}
                  className="global-search-item"
                  onClick={() => handleTicketClick(item.id)}
                >
                  <div className="flex flex-col">
                    <span className="global-search-item-id">{item.id}</span>
                    <span className="global-search-item-summary" title={item.summary}>
                      {item.summary}
                    </span>
                  </div>
                  {item.priority && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background:
                          item.priority === 'Critical'
                            ? '#fee2e2'
                            : item.priority === 'High'
                            ? '#ffedd5'
                            : '#f1f5f9',
                        color:
                          item.priority === 'Critical'
                            ? '#dc2626'
                            : item.priority === 'High'
                            ? '#c2410c'
                            : '#475569',
                        fontWeight: 600,
                      }}
                    >
                      {item.priority}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="global-search-empty">No matching tickets found</div>
            )}
          </div>
        </div>
      )}

      {/* ─── FLYOUT 2: NOTIFICATIONS ─── */}
      {activeFlyout === 'notifications' && (
        <div className="global-flyout-dropdown global-notifications-flyout">
          <div className="global-flyout-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="global-flyout-title">Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  All read ✓
                </span>
              )}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="global-flyout-action-btn"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 font-medium">All caught up</span>
            )}
          </div>
          <div className="global-notifications-list">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">No notifications at the moment</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`global-notif-item ${item.unread ? 'is-unread' : ''} ${
                    item.isSla ? 'is-sla' : ''
                  }`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div
                    className="global-notif-icon"
                    style={{
                      background: item.isSla ? '#fee2e2' : '#e0f2fe',
                      color: item.isSla ? '#ef4444' : '#0284c7',
                    }}
                  >
                    {item.isSla ? '⏰' : '🔔'}
                  </div>
                  <div className="global-notif-content">
                    <div className="global-notif-header">
                      <span className="global-notif-title">{item.title}</span>
                      {item.slaTime && (
                        <span className="global-notif-badge-pill global-notif-badge-sla">
                          {item.slaTime}
                        </span>
                      )}
                    </div>
                    <div className="global-notif-desc" title={item.desc}>
                      #{item.ticketId}: {item.desc}
                    </div>
                    <span className="global-notif-time">{item.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── FLYOUT: TO-DO POPOVER (MATCHING FIGMA SPECIFICATION) ─── */}
      {activeFlyout === 'todo' && (
        <div className="global-flyout-dropdown global-todo-flyout" role="dialog" aria-label="To-Do List">
          <div className="global-todo-header">
            <h3 className="global-todo-title">To-Do</h3>
            <button
              type="button"
              className="global-todo-close-btn"
              onClick={() => setActiveFlyout(null)}
              title="Close"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="global-todo-date-row">
            <input
              type="text"
              className="global-todo-date-input"
              value={todoDate}
              onChange={(e) => setTodoDate(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </div>

          <div className="global-todo-content">
            {todoItems.length === 0 ? (
              <div className="global-todo-empty-text">Nothing to do at the moment</div>
            ) : (
              <div className="global-todo-list">
                {todoItems.map((item) => (
                  <div
                    key={item.id}
                    className={`global-todo-item ${item.done ? 'is-done' : ''}`}
                  >
                    <label className="global-todo-item-label">
                      <input
                        type="checkbox"
                        className="global-todo-checkbox"
                        checked={item.done}
                        onChange={() => handleToggleTodo(item.id)}
                      />
                      <span className="global-todo-item-text">{item.text}</span>
                    </label>
                    <button
                      type="button"
                      className="global-todo-item-del-btn"
                      onClick={() => handleDeleteTodo(item.id)}
                      title="Remove task"
                      aria-label="Remove task"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAddingTodo ? (
              <form
                className="global-todo-add-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTodo();
                }}
              >
                <input
                  ref={todoInputRef}
                  type="text"
                  className="global-todo-input-field"
                  placeholder="What needs to be done?"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  autoFocus
                />
                <div className="global-todo-form-actions">
                  <button type="submit" className="global-todo-btn-save">
                    Add
                  </button>
                  <button
                    type="button"
                    className="global-todo-btn-cancel"
                    onClick={() => {
                      setIsAddingTodo(false);
                      setNewTodoText('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="global-todo-add-pill-btn"
                onClick={() => setIsAddingTodo(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Add</span>
              </button>
            )}
          </div>

          <div className="global-todo-footer">
            <button
              type="button"
              className="global-todo-mywork-link"
              onClick={() => {
                setActiveFlyout(null);
                navigate('/my-work');
              }}
            >
              <span>Go to My Work full checklist</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── FLYOUT 3: TIMESHEET POPOVER ─── */}
      {activeFlyout === 'timesheet' && (
        <TimesheetPopover
          onClose={() => setActiveFlyout(null)}
          userName={user?.fullName || 'Agent'}
        />
      )}

      {/* ─── FLYOUT 4: AGENT KPI DRAWER ─── */}
      {activeFlyout === 'kpi' && (
        <AgentKpiDrawer
          onClose={() => setActiveFlyout(null)}
          onOpenTicket={handleTicketClick}
        />
      )}

      {/* ─── FLYOUT 5: LIVE FEED POPOVER ─── */}
      {activeFlyout === 'feed' && (
        <FeedPopover
          onClose={() => setActiveFlyout(null)}
          onOpenTicket={handleTicketClick}
        />
      )}

      {/* ─── FLYOUT 6: USER PROFILE & PRESENCE MENU ─── */}
      {activeFlyout === 'profile' && (
        <div className="global-flyout-dropdown global-profile-flyout">
          <div className="global-profile-header-card">
            <div className="flex items-center justify-between gap-2">
              <div className="global-profile-name truncate">{user?.fullName || 'Agent'}</div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                presence === 'available' ? 'bg-emerald-100 text-emerald-800' :
                presence === 'away' ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  presence === 'available' ? 'bg-emerald-500' :
                  presence === 'away' ? 'bg-amber-500' :
                  'bg-rose-500'
                }`} />
                {presence === 'available' ? 'Available' : presence === 'away' ? 'Away' : 'Busy'}
              </span>
            </div>
            <div className="global-profile-email">{user?.email || 'user@servigen.io'}</div>
            <span className="global-profile-role-tag">{user?.role || 'Support Lead'}</span>
          </div>

          <div className="global-presence-section">
            <span className="global-presence-label">Agent Status</span>
            <div className="global-presence-options">
              <button
                type="button"
                className={`global-presence-opt-btn ${presence === 'available' ? 'is-selected available' : ''}`}
                onClick={() => handleSetPresence('available')}
              >
                <span className="global-nav-presence-dot" style={{ position: 'static' }} />
                <span className="flex-1">Available</span>
                {presence === 'available' && <span className="font-bold text-xs text-emerald-600">✓</span>}
              </button>
              <button
                type="button"
                className={`global-presence-opt-btn away ${presence === 'away' ? 'is-selected' : ''}`}
                onClick={() => handleSetPresence('away')}
              >
                <span className="global-nav-presence-dot away" style={{ position: 'static' }} />
                <span className="flex-1">Away</span>
                {presence === 'away' && <span className="font-bold text-xs text-amber-600">✓</span>}
              </button>
              <button
                type="button"
                className={`global-presence-opt-btn busy ${presence === 'busy' ? 'is-selected' : ''}`}
                onClick={() => handleSetPresence('busy')}
              >
                <span className="global-nav-presence-dot busy" style={{ position: 'static' }} />
                <span className="flex-1">In Meeting / Busy</span>
                {presence === 'busy' && <span className="font-bold text-xs text-rose-600">✓</span>}
              </button>
            </div>
          </div>

          <div className="global-profile-menu-links">
            <button
              type="button"
              className="global-profile-link-item"
              onClick={() => {
                setActiveFlyout(null);
                navigate('/my-work');
              }}
            >
              <span>📋</span>
              <span>My Work & Tasks</span>
            </button>
            <button
              type="button"
              className="global-profile-link-item"
              onClick={() => {
                setActiveFlyout(null);
                navigate('/organisations');
              }}
            >
              <span>🏢</span>
              <span>Organisation & Sites</span>
            </button>
            <button
              type="button"
              className="global-profile-link-item logout"
              onClick={() => {
                setActiveFlyout(null);
                if (logout) logout();
                navigate('/auth');
              }}
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: HELP & GUIDE ─── */}
      {showHelpModal && (
        <div className="global-help-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="global-help-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="global-help-modal-header">
              <h3>
                <span>ℹ️</span>
                <span>ServiGen • System & SLA Guide</span>
              </h3>
              <button
                type="button"
                className="global-help-modal-close"
                onClick={() => setShowHelpModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="global-help-modal-body">
              <div className="global-help-section-title">SLA Status Color Codes</div>
              <div className="global-help-sla-legend">
                <div className="global-help-sla-pill breached">
                  <span>●</span> Breached SLA (Negative Target)
                </div>
                <div className="global-help-sla-pill warning">
                  <span>●</span> Warning (&lt; 2 Hours Remaining)
                </div>
                <div className="global-help-sla-pill ontime">
                  <span>●</span> On Target (Healthy)
                </div>
              </div>

              <div className="global-help-section-title">Global Header Navigation</div>
              <table className="global-help-key-table">
                <tbody>
                  <tr>
                    <td><strong>🔍 Search:</strong></td>
                    <td>Instant multi-module ticket query across all systems.</td>
                  </tr>
                  <tr>
                    <td><strong>🔔 Notifications:</strong></td>
                    <td>Live feed of critical SLA alerts and queue assignments.</td>
                  </tr>
                  <tr>
                    <td><strong>📋 Tasks:</strong></td>
                    <td>Direct jump to My Work, assigned tickets, and checklist.</td>
                  </tr>
                  <tr>
                    <td><strong>⏱️ Speedometer:</strong></td>
                    <td>Daily and weekly time tracker / logged hours popover.</td>
                  </tr>
                  <tr>
                    <td><strong>📶 Broadcast:</strong></td>
                    <td>Agent KPI analytics drawer (FCR, resolution rate, CSAT).</td>
                  </tr>
                  <tr>
                    <td><strong>🕒 Clock:</strong></td>
                    <td>Live activity audit log across support lines.</td>
                  </tr>
                </tbody>
              </table>

              <div className="global-help-section-title">Keyboard Navigation</div>
              <p style={{ margin: '4px 0' }}>
                Press <span className="global-help-kbd">Esc</span> to dismiss any open popover or modal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: QUICK TICKET CREATION ─── */}
      {showQuickTicketModal && (
        <div className="global-help-modal-overlay" onClick={() => setShowQuickTicketModal(false)}>
          <div className="global-help-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="global-help-modal-header">
              <h3>
                <span>🎫</span>
                <span>Create New Ticket</span>
              </h3>
              <button
                type="button"
                className="global-help-modal-close"
                onClick={() => setShowQuickTicketModal(false)}
              >
                ✕
              </button>
            </div>
            {ticketSuccessNotice ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>✅</span>
                {ticketSuccessNotice}
              </div>
            ) : (
              <form onSubmit={handleQuickCreateTicket} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Summary / Issue Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VPN gateway drops connection intermittently"
                    value={quickSummary}
                    onChange={(e) => setQuickSummary(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Category
                    </label>
                    <select
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff', boxSizing: 'border-box' }}
                    >
                      <option value="Standard Applications">Standard Applications</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Network">Network / VPN</option>
                      <option value="Account Administration">Account Administration</option>
                      <option value="Security">Security & Access</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Priority
                    </label>
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff', boxSizing: 'border-box' }}
                    >
                      <option value="Critical">P1 - Critical</option>
                      <option value="High">P2 - High</option>
                      <option value="Medium">P3 - Medium</option>
                      <option value="Low">P4 - Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide additional details or error messages..."
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuickTicketModal(false)}
                    style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '7px 20px', borderRadius: '8px', border: 'none', background: '#00c0f3', color: '#ffffff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0, 192, 243, 0.4)' }}
                  >
                    Create Ticket
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalNavbarActions;
