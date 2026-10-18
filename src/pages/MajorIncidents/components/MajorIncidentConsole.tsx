import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MajorIncident, UserRole, IncidentUpdate, Priority, LifecycleStage } from '../types/majorIncident.types';
import './MajorIncidentConsole.css';

interface MajorIncidentConsoleProps {
  incident: MajorIncident;
  role: UserRole;
  onBack: () => void;
  onAdvanceStage?: (incidentId: string) => void;
  onAddUpdate?: (incidentId: string, update: IncidentUpdate) => void;
  onReassignCommander?: (incidentId: string, newCommander: string) => void;
  onUpdatePriority?: (incidentId: string, newPriority: Priority) => void;
  allIncidents?: MajorIncident[];
  onSelectIncident?: (id: string) => void;
  onOpenNewTicket?: () => void;
}

export interface WorkTask {
  id: string;
  team: string;
  summary: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Recovery' | 'Diagnosis' | 'Blocked';
  activity: string;
  type: 'technical' | 'business';
  checked?: boolean;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'all' | 'kb' | 'urgent' | 'tickets' | 'approved' | 'restricted';
  tags: string[];
  views: number;
  helpful: number;
  score: string;
  snippet: string;
  fullContent?: string;
}

const DEFAULT_TECHNICAL_TASKS: WorkTask[] = [];

const DEFAULT_BUSINESS_TASKS: WorkTask[] = [];

// KB articles loaded from /api/kb/articles at runtime
const ALL_KB_ARTICLES: KnowledgeArticle[] = [];

export const MajorIncidentConsole: React.FC<MajorIncidentConsoleProps> = ({
  incident: initialIncident,
  role,
  onBack,
  onAdvanceStage,
  onAddUpdate,
  onReassignCommander,
  onUpdatePriority,
  allIncidents = [],
  onSelectIncident,
  onOpenNewTicket,
}) => {
  const navigate = useNavigate();
  // Local editable incident properties for instant UI response
  const [currentPriority, setCurrentPriority] = useState<Priority>(initialIncident.priority);
  const [currentAssignee, setCurrentAssignee] = useState<string>(initialIncident.assignee);
  const [currentLocation, setCurrentLocation] = useState<string>('Site 2');
  const [currentCustomerCount, setCurrentCustomerCount] = useState<number>(1);
  const [editTitle, setEditTitle] = useState(initialIncident.title);
  const [editProduct, setEditProduct] = useState(initialIncident.product);
  const [impactStatement, setImpactStatement] = useState<string>(
    `Users cannot access ${initialIncident.product || 'MyFinance'}, preventing financial data entry and reporting activities. The issue is partially affecting business operations.`
  );

  // Chevron lifecycle pipeline local state (so clicking any stage immediately activates it!)
  const [currentStages, setCurrentStages] = useState<LifecycleStage[]>(
    initialIncident.lifecycleStages && initialIncident.lifecycleStages.length > 0
      ? initialIncident.lifecycleStages
      : [
          { label: 'Started', timestamp: '11/02/2025 4:57 PM', isActive: true, isCompleted: false },
          { label: 'Escalated', isActive: false, isCompleted: false },
          { label: 'Diagnosed', isActive: false, isCompleted: false },
          { label: 'Mitigated', isActive: false, isCompleted: false },
          { label: 'Resolved', isActive: false, isCompleted: false },
          { label: 'Closed', isActive: false, isCompleted: false },
        ]
  );

  // Sync when incident changes
  useEffect(() => {
    setCurrentPriority(initialIncident.priority);
    setCurrentAssignee(initialIncident.assignee);
    setEditTitle(initialIncident.title);
    setEditProduct(initialIncident.product);
    if (initialIncident.lifecycleStages && initialIncident.lifecycleStages.length > 0) {
      setCurrentStages(initialIncident.lifecycleStages);
    }
  }, [initialIncident]);

  // Navigation between incidents
  const currentIndex = allIncidents.findIndex((i) => i.id === initialIncident.id);
  const handlePrev = () => {
    if (currentIndex > 0 && onSelectIncident) {
      onSelectIncident(allIncidents[currentIndex - 1].id);
      showToast(`Switched to Incident #${allIncidents[currentIndex - 1].id.replace(/^0+/, '')}`);
    }
  };
  const handleNext = () => {
    if (currentIndex < allIncidents.length - 1 && onSelectIncident) {
      onSelectIncident(allIncidents[currentIndex + 1].id);
      showToast(`Switched to Incident #${allIncidents[currentIndex + 1].id.replace(/^0+/, '')}`);
    }
  };

  // State
  const [activeTab, setActiveTab] = useState<string>('Major Incident Console');
  const [workActivityTab, setWorkActivityTab] = useState<'technical' | 'business'>('technical');
  const [technicalTasks, setTechnicalTasks] = useState<WorkTask[]>(DEFAULT_TECHNICAL_TASKS);
  const [businessTasks, setBusinessTasks] = useState<WorkTask[]>(DEFAULT_BUSINESS_TASKS);

  // Dropdowns & Toolbar states
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState<boolean>(false);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI & Knowledge Base States
  const [isAiArticlesOpen, setIsAiArticlesOpen] = useState<boolean>(true);
  const [aiFilterCategory, setAiFilterCategory] = useState<'all' | 'kb' | 'urgent' | 'tickets' | 'approved' | 'restricted'>('all');
  const [isKbModalOpen, setIsKbModalOpen] = useState<boolean>(false);
  const [selectedKbArticle, setSelectedKbArticle] = useState<KnowledgeArticle | null>(null);
  const [kbCategory, setKbCategory] = useState<string>('All');
  const [isKbCategoryDropdownOpen, setIsKbCategoryDropdownOpen] = useState<boolean>(false);
  const [kbSearchQuery, setKbSearchQuery] = useState<string>(`id=${initialIncident.id.replace(/^0+/, '')}`);

  // Note Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [isNoteFullscreen, setIsNoteFullscreen] = useState<boolean>(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [noteType, setNoteType] = useState<'internal' | 'external' | 'update'>('internal');
  const [noteContent, setNoteContent] = useState<string>('');
  const [hoursTaken, setHoursTaken] = useState<string>('00');
  const [minutesTaken, setMinutesTaken] = useState<string>('01');

  // Inline Editing States
  const [isEditingPriority, setIsEditingPriority] = useState<boolean>(false);
  const [isEditingAssignee, setIsEditingAssignee] = useState<boolean>(false);
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
  const [isEditingImpactStatement, setIsEditingImpactStatement] = useState<boolean>(false);
  const [activeTaskStatusDropdown, setActiveTaskStatusDropdown] = useState<string | null>(null);

  // Task Details Modal
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);

  // Multi-modal modal manager
  type ModalType =
    | 'comms'
    | 'customers'
    | 'problem'
    | 'contributors'
    | 'add_task'
    | 'edit_details'
    | 'notifications'
    | 'tasks'
    | 'performance'
    | 'health'
    | 'timesheet'
    | 'help'
    | 'profile'
    | 'get_started'
    | 'sla_breakdown'
    | 'ci_details'
    | null;

  const [activeActionModal, setActiveActionModal] = useState<ModalType>(null);

  // New task form state
  const [newTaskSummary, setNewTaskSummary] = useState('');
  const [newTaskTeam, setNewTaskTeam] = useState('Infrastructure');
  const [newTaskActivity, setNewTaskActivity] = useState('Diagnosis');

  // Timesheet timer state
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Local activity feed
  const [activities, setActivities] = useState([
    {
      id: 'act-1',
      author: 'Admin (You)',
      type: 'Internal Update',
      date: '18/05/2026 4:06 AM',
      timeTaken: '00:01',
      edited: true,
      content:
        'The rollback of the recent SSO update has restored access for a portion of users, but some accounts remain locked due to invalid session tokens. We are manually clearing affected sessions and advising impacted users to reset their authentication tokens if unable to connect.',
    },
  ]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Clean incident short id for display (e.g. 2673)
  const shortId = initialIncident.id.replace(/^0+/, '') || initialIncident.id;

  // Chevron stage click handler: activates whichever stage user clicks!
  const handleChevronClick = (targetIndex: number) => {
    const now = new Date().toLocaleString('en-GB', {
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetLabel = currentStages[targetIndex]?.label;
    const newStages = currentStages.map((s, idx) => ({
      ...s,
      isCompleted: idx < targetIndex || (targetIndex === currentStages.length - 1 && idx === targetIndex),
      isActive: idx === targetIndex,
      timestamp: idx === targetIndex ? (s.timestamp || now) : s.timestamp,
    }));

    setCurrentStages(newStages);

    const updateLog: IncidentUpdate = {
      id: `u-${Date.now()}`,
      timestamp: now,
      author: role === 'Admin' ? 'Admin (You)' : currentAssignee || 'Commander',
      authorRole: role,
      type: 'stage_change',
      content: `Lifecycle stage advanced to ${targetLabel}`,
    };

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        author: updateLog.author,
        type: 'Stage Advanced',
        date: now,
        timeTaken: '00:01',
        edited: false,
        content: `Stage transitioned to ${targetLabel}. Response teams aligned.`,
      },
      ...prev,
    ]);

    if (onAdvanceStage) {
      onAdvanceStage(initialIncident.id);
    }
    showToast(`Stage updated to ${targetLabel}`);
  };

  // Filtered AI articles
  const filteredArticles = useMemo(() => {
    if (aiFilterCategory === 'all') return ALL_KB_ARTICLES;
    return ALL_KB_ARTICLES.filter((a) => a.category === aiFilterCategory || a.category === 'all');
  }, [aiFilterCategory]);

  // Filtered KB Modal articles
  const displayedKbArticles = useMemo(() => {
    let list = ALL_KB_ARTICLES;
    if (kbCategory !== 'All') {
      const catMap: Record<string, string> = {
        'Knowledge Articles': 'kb',
        'Urgent Workarounds': 'urgent',
        'Related Tickets': 'tickets',
        'Approved Runbooks': 'approved',
      };
      const mapped = catMap[kbCategory];
      if (mapped) list = list.filter((a) => a.category === mapped);
    }
    if (kbSearchQuery.trim()) {
      const q = kbSearchQuery.toLowerCase().replace(/id=\d+/g, '').trim();
      if (q) {
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.snippet.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
    }
    return list;
  }, [kbCategory, kbSearchQuery]);

  // Save Note handler
  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    const now = new Date().toLocaleString('en-GB', {
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newAct = {
      id: `act-${Date.now()}`,
      author: role === 'Admin' ? 'Admin (You)' : currentAssignee || 'Commander',
      type: noteType === 'external' ? 'External Update' : 'Internal Update',
      date: now,
      timeTaken: `${hoursTaken.padStart(2, '0')}:${minutesTaken.padStart(2, '0')}`,
      edited: false,
      content: noteContent.trim(),
    };

    setActivities((prev) => [newAct, ...prev]);

    if (onAddUpdate) {
      onAddUpdate(initialIncident.id, {
        id: `u-${Date.now()}`,
        timestamp: now,
        author: newAct.author,
        authorRole: role,
        type: noteType === 'external' ? 'external_note' : 'comment',
        content: newAct.content,
      });
    }

    setNoteContent('');
    setIsNoteModalOpen(false);
    showToast('Incident update saved and broadcasted');
  };

  // Add task handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskSummary.trim()) return;
    const taskNum = Math.floor(Math.random() * 900) + 100;
    const newTask: WorkTask = {
      id: `0002${taskNum}-${workActivityTab === 'technical' ? 'C' : 'B'}`,
      team: newTaskTeam,
      summary: newTaskSummary.trim(),
      status: 'New',
      activity: newTaskActivity,
      type: workActivityTab,
    };

    if (workActivityTab === 'technical') {
      setTechnicalTasks((prev) => [newTask, ...prev]);
    } else {
      setBusinessTasks((prev) => [newTask, ...prev]);
    }

    setNewTaskSummary('');
    setActiveActionModal(null);
    showToast(`Task ${newTask.id} created`);
  };

  // Task selection & bulk action support
  const currentTaskList = workActivityTab === 'technical' ? technicalTasks : businessTasks;
  const selectedTaskCount = currentTaskList.filter((t) => t.checked).length;

  const toggleTaskCheck = (taskId: string, type: 'technical' | 'business') => {
    if (type === 'technical') {
      setTechnicalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, checked: !t.checked } : t))
      );
    } else {
      setBusinessTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, checked: !t.checked } : t))
      );
    }
  };

  const handleBulkStatusChange = (newStatus: WorkTask['status']) => {
    if (workActivityTab === 'technical') {
      setTechnicalTasks((prev) =>
        prev.map((t) => (t.checked ? { ...t, status: newStatus, checked: false } : t))
      );
    } else {
      setBusinessTasks((prev) =>
        prev.map((t) => (t.checked ? { ...t, status: newStatus, checked: false } : t))
      );
    }
    showToast(`Updated ${selectedTaskCount} tasks to ${newStatus}`);
  };

  const handleBulkDelete = () => {
    if (workActivityTab === 'technical') {
      setTechnicalTasks((prev) => prev.filter((t) => !t.checked));
    } else {
      setBusinessTasks((prev) => prev.filter((t) => !t.checked));
    }
    showToast(`Deleted ${selectedTaskCount} tasks`);
  };

  const handleBulkClear = () => {
    if (workActivityTab === 'technical') {
      setTechnicalTasks((prev) => prev.map((t) => ({ ...t, checked: false })));
    } else {
      setBusinessTasks((prev) => prev.map((t) => ({ ...t, checked: false })));
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: WorkTask['status'], type: 'technical' | 'business') => {
    if (type === 'technical') {
      setTechnicalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } else {
      setBusinessTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    }
    setActiveTaskStatusDropdown(null);
    showToast(`Task ${taskId} status changed to ${newStatus}`);
  };

  // WYSIWYG Editor Insert Helpers
  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    setNoteContent((prev) => `${prev}\n${prefix}${suffix}`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen bg-[#f8fafc] overflow-y-auto mi-console-scroll font-sans text-gray-800 relative">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Bar (Breadcrumb + Actions) ── */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <button
            onClick={() => {
              if (onBack) onBack();
              else navigate('/major-incidents/live');
            }}
            className="hover:text-cyan-600 transition-colors cursor-pointer font-medium"
            title="Return to Major Incidents"
          >
            Major Incidents
          </button>
          <span className="text-gray-300">›</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 hover:text-cyan-600 transition-colors cursor-pointer text-gray-700"
            title="Go to Main ITSM Dashboard"
          >
            <span>🌐</span> Major Incident Dashboard
          </button>
          <span className="text-gray-300">›</span>
          <span className="font-bold text-white bg-[#13273e] px-2.5 py-0.5 rounded-full text-[11px] shadow-2xs">
            {shortId}
          </span>
        </div>

        {/* Right: Header Buttons & Global Icons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveActionModal('get_started')}
            className="bg-[#e49b8e] hover:bg-[#d8897c] text-[#3a201a] text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap shadow-2xs cursor-pointer active:scale-95"
          >
            Get started
          </button>
          <button
            onClick={() => {
              if (onOpenNewTicket) onOpenNewTicket();
              else showToast('Opening new incident ticket wizard...');
            }}
            className="flex items-center gap-1 bg-[#e49b8e] hover:bg-[#d8897c] text-[#3a201a] text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap shadow-2xs cursor-pointer active:scale-95"
          >
            <span className="text-base leading-none font-medium">+</span>
            <span>New Ticket</span>
          </button>

          {/* Icon buttons with interactive modals */}
          <div className="flex items-center gap-1.5 ml-1 text-[#4a2820]">
            <button
              onClick={() => setIsKbModalOpen(true)}
              title="Search Knowledge Base"
              className="w-8 h-8 rounded-full border border-[#e49b8e] bg-white text-[#4a2820] hover:bg-[#fbf0ee] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setActiveActionModal('notifications')}
              title="Notifications"
              className="w-8 h-8 rounded-full border border-[#e49b8e] bg-white text-[#4a2820] hover:bg-[#fbf0ee] flex items-center justify-center transition-colors cursor-pointer relative active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button
              onClick={() => setActiveActionModal('tasks')}
              title="My Assigned Action Tasks"
              className="w-8 h-8 rounded-full border border-[#e49b8e] bg-white text-[#4a2820] hover:bg-[#fbf0ee] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                  strokeWidth="2"
                />
                <rect x="9" y="3" width="6" height="4" rx="1" strokeWidth="2" />
              </svg>
            </button>
            <button
              onClick={() => setActiveActionModal('performance')}
              title="SLA Performance"
              className="w-8 h-8 rounded-full border border-[#e49b8e] bg-white text-[#4a2820] hover:bg-[#fbf0ee] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 2a10 10 0 1 0 10 10" strokeWidth="2" />
                <path d="M12 12 18 6" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setActiveActionModal('health')}
              title="System & Service Health"
              className="w-8 h-8 rounded-full border border-[#e49b8e] bg-white text-[#4a2820] hover:bg-[#fbf0ee] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeWidth="2" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeWidth="2" />
              </svg>
            </button>
            <button
              onClick={() => setActiveActionModal('timesheet')}
              title="Timesheet & Time Tracker"
              className="w-8 h-8 rounded-full border border-[#e49b8e] bg-white text-[#4a2820] hover:bg-[#fbf0ee] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setActiveActionModal('help')}
              title="Major Incident SOP Process"
              className="w-8 h-8 rounded-full border border-[#e49b8e] bg-white text-[#4a2820] hover:bg-[#fbf0ee] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2" />
              </svg>
            </button>

            {/* Profile Avatar */}
            <div
              onClick={() => setActiveActionModal('profile')}
              title="Your Account & Profile"
              className="w-8 h-8 rounded-full bg-cyan-400 text-white font-bold text-xs flex items-center justify-center ml-1 border-2 border-white shadow-xs cursor-pointer hover:bg-cyan-500 transition-colors active:scale-95"
            >
              Q
            </div>
          </div>
        </div>
      </header>

      {/* ── Sub-Bar Action Pills (Image 1 Toolbar) ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between sticky top-[53px] z-20 shadow-2xs">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Back Circular Button */}
          <button
            onClick={onBack}
            title="Back to Dashboard"
            className="w-8 h-8 rounded-full border border-gray-300 hover:border-gray-400 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-2xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Update Incidents */}
          <button
            onClick={() => {
              setNoteType('update');
              setIsNoteModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <span className="text-cyan-600 font-bold">↪</span>
            <span>Update Incidents</span>
          </button>

          {/* Communications */}
          <button
            onClick={() => setActiveActionModal('comms')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <span className="text-emerald-500 font-bold">💬</span>
            <span>Communications</span>
          </button>

          {/* Impacted Customers */}
          <button
            onClick={() => setActiveActionModal('customers')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <span className="text-rose-500 font-bold">!</span>
            <span>Impacted Custome...</span>
          </button>

          {/* Raise Problem */}
          <button
            onClick={() => setActiveActionModal('problem')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <span className="text-blue-500 font-bold">🔧</span>
            <span>Raise Problem</span>
          </button>

          {/* Contributors */}
          <button
            onClick={() => setActiveActionModal('contributors')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <span className="text-purple-500 font-bold">👥</span>
            <span>Contributors</span>
          </button>
        </div>

        {/* Right Tools (< > ↗ >> 👁 share ···) */}
        <div className="flex items-center gap-1.5 text-gray-400 shrink-0 relative">
          <button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            title="Previous Incident"
            className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-bold active:scale-95"
          >
            &lt;
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= allIncidents.length - 1}
            title="Next Incident"
            className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-bold active:scale-95"
          >
            &gt;
          </button>

          {/* ↗ Pop out */}
          <button
            onClick={() => window.open(`/major-incidents/live?incident=${initialIncident.id}`, '_blank')}
            title="Pop out in new tab"
            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors cursor-pointer text-xs font-bold active:scale-95"
          >
            ↗
          </button>

          {/* >> Fast forward stage */}
          <button
            title="Advance Incident Stage"
            onClick={() => {
              const activeIdx = currentStages.findIndex((s) => s.isActive);
              if (activeIdx < currentStages.length - 1) {
                handleChevronClick(activeIdx + 1);
              } else {
                showToast('Incident is already in final closed stage');
              }
            }}
            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-cyan-600 transition-colors cursor-pointer text-xs font-bold active:scale-95"
          >
            &gt;&gt;
          </button>

          {/* 👁 Watch/Subscribe */}
          <button
            title={isWatching ? 'Unwatch Incident' : 'Watch Incident'}
            onClick={() => {
              setIsWatching((w) => !w);
              showToast(!isWatching ? `Watching #${shortId}` : `Unwatched #${shortId}`);
            }}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer text-xs active:scale-95 ${
              isWatching ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            👁
          </button>

          {/* Share Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsShareMenuOpen((o) => !o);
                setIsOptionsMenuOpen(false);
              }}
              title="Share Incident Options"
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer text-xs active:scale-95 ${
                isShareMenuOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {isShareMenuOpen && (
              <div className="absolute right-0 top-9 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs font-medium text-gray-700 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Share Options
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showToast('Link copied to clipboard!');
                    setIsShareMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <span>🔗</span> Copy Incident Link
                </button>
                <button
                  onClick={() => {
                    window.location.href = `mailto:?subject=Major Incident Alert: ${editTitle}&body=Major Incident #${shortId} is active: ${window.location.href}`;
                    setIsShareMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <span>✉️</span> Email Incident Summary
                </button>
                <button
                  onClick={() => {
                    showToast('Broadcast queued to #war-room-major-incidents Slack channel');
                    setIsShareMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <span>💬</span> Send to Slack Channel
                </button>
                <button
                  onClick={() => {
                    showToast('Teams bridge alert sent to IT Operations group');
                    setIsShareMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <span>👥</span> Microsoft Teams Broadcast
                </button>
              </div>
            )}
          </div>

          {/* ── ··· MORE OPTIONS DROPDOWN MENU ── */}
          <div className="relative">
            <button
              onClick={() => {
                setIsOptionsMenuOpen((o) => !o);
                setIsShareMenuOpen(false);
              }}
              title="More Incident Options"
              className={`w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-colors cursor-pointer active:scale-95 ${
                isOptionsMenuOpen ? 'bg-cyan-50 text-cyan-600 border border-cyan-300' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              ···
            </button>

            {isOptionsMenuOpen && (
              <div className="absolute right-0 top-9 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs font-medium text-gray-700 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100">
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Console Options
                  </div>
                  <button
                    onClick={() => {
                      setActiveActionModal('edit_details');
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>✏️</span> Edit Incident Details
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPriority(true);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>⚡</span> Change Priority ({currentPriority})
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingAssignee(true);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>👤</span> Reassign MI Manager
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingLocation(true);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>🏢</span> Update Affected Location
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => {
                      setActiveActionModal('comms');
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>📢</span> Post Stakeholder Update
                  </button>
                  <button
                    onClick={() => {
                      setActiveActionModal('problem');
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>🔧</span> Link Problem Record (RCA)
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>🖨️</span> Print Incident Briefing
                  </button>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                        id: initialIncident.id,
                        title: editTitle,
                        priority: currentPriority,
                        product: editProduct,
                        manager: currentAssignee,
                        location: currentLocation,
                        impact: impactStatement,
                        technicalTasks,
                        businessTasks,
                        activities,
                      }, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `Major_Incident_${shortId}_Report.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast('Incident JSON report downloaded');
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <span>📥</span> Export Incident Report (.json)
                  </button>
                </div>

                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Connected Modules & Views
                  </div>
                  <button
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      navigate('/reports/incidents-by-category');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cyan-50 flex items-center gap-2 text-gray-800 hover:text-cyan-800 cursor-pointer"
                  >
                    <span>📊</span> Incidents by Category Report
                  </button>
                  <button
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      navigate('/change-requests');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cyan-50 flex items-center gap-2 text-gray-800 hover:text-cyan-800 cursor-pointer"
                  >
                    <span>🔧</span> Change Requests & RCA
                  </button>
                  <button
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      navigate('/cmdb/services');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cyan-50 flex items-center gap-2 text-gray-800 hover:text-cyan-800 cursor-pointer"
                  >
                    <span>⚙️</span> CMDB Topology & Services
                  </button>
                  <button
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      navigate('/calendar');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cyan-50 flex items-center gap-2 text-gray-800 hover:text-cyan-800 cursor-pointer"
                  >
                    <span>📅</span> Major Incident Calendar
                  </button>
                  <button
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      navigate('/major-incidents/list');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cyan-50 flex items-center gap-2 text-gray-800 hover:text-cyan-800 cursor-pointer"
                  >
                    <span>📋</span> Major Incident Register (List View)
                  </button>
                  <button
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      navigate('/major-incidents/feed');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cyan-50 flex items-center gap-2 text-gray-800 hover:text-cyan-800 cursor-pointer"
                  >
                    <span>📡</span> Major Incident Feed View
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => {
                      handleChevronClick(5);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-semibold cursor-pointer"
                  >
                    <span>🔒</span> Close / Resolve Incident
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="px-6 py-4 space-y-4 max-w-[1700px] w-full mx-auto">
        {/* Incident Title Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {editTitle}
            </h1>
          </div>
          <button
            onClick={() => setActiveActionModal('edit_details')}
            className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer active:scale-95"
          >
            <span>✎</span> Edit Details
          </button>
        </div>

        {/* ── Chevron Lifecycle Process Pipeline (Image 1 & 2) ── */}
        <div className="mi-chevron-container py-1">
          {currentStages.map((stage, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === currentStages.length - 1;
            const isActive = stage.isActive;
            const isCompleted = stage.isCompleted;

            let bgClass = 'bg-[#f1f3f6] text-gray-600';
            if (isActive) {
              bgClass = 'bg-[#00c0f3] text-white shadow-xs';
            } else if (isCompleted) {
              bgClass = 'bg-[#009bc5] text-white';
            }

            const shapeClass = isFirst
              ? 'mi-chevron-first'
              : isLast
              ? 'mi-chevron-last'
              : 'mi-chevron-middle';

            return (
              <div
                key={stage.label}
                onClick={() => handleChevronClick(idx)}
                className={`flex-1 min-w-[140px] h-12 flex flex-col items-center justify-center px-4 transition-all cursor-pointer hover:opacity-90 active:scale-98 select-none ${shapeClass} ${bgClass}`}
                title={`Click to switch stage to ${stage.label}`}
              >
                <span className={`text-xs ${isActive ? 'font-bold' : 'font-semibold'} leading-tight text-center`}>
                  {stage.label}
                </span>
                {stage.timestamp && (
                  <span className={`text-[10px] ${isActive ? 'text-white/90 font-medium' : 'text-gray-400'} mt-0.5 leading-none text-center`}>
                    {stage.timestamp}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Tabs Bar (Interactive Tab Options) ── */}
        <div className="border-b border-gray-200 flex items-center gap-6 text-xs font-semibold text-gray-600 overflow-x-auto">
          {[
            'Major Incident Console',
            `Technical (${technicalTasks.length})`,
            `Business (${businessTasks.length})`,
            'Details',
            'Progress',
            'Impact',
            'Contributors',
            'View Log',
            'Related CIs',
            'Notification Log',
          ].map((tab) => {
            const isCurrent =
              activeTab === tab ||
              (tab.startsWith('Technical') && activeTab.startsWith('Technical')) ||
              (tab.startsWith('Business') && activeTab.startsWith('Business'));
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab.startsWith('Technical')) setWorkActivityTab('technical');
                  if (tab.startsWith('Business')) setWorkActivityTab('business');
                }}
                className={`py-3 relative whitespace-nowrap transition-colors cursor-pointer active:scale-95 ${
                  isCurrent
                    ? 'text-cyan-500 font-bold border-b-2 border-cyan-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: MAJOR INCIDENT CONSOLE & WORK ACTIVITY (Primary View)
        ═══════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'Major Incident Console' || activeTab.startsWith('Technical') || activeTab.startsWith('Business')) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative items-start">
            {/* ═══════ LEFT COLUMN (8 cols): Metrics, Impact Statement, Work Activity ═══════ */}
            <div className="lg:col-span-8 space-y-4">
              {/* Metric Cards Row (4 cards with interactive edit options) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* 1. Priority */}
                <div
                  onClick={() => setIsEditingPriority(true)}
                  className="bg-white border border-gray-200/80 hover:border-cyan-400 rounded-xl p-3.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all relative group active:scale-98"
                  title="Click to change Priority option"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-gray-500 font-medium block">Priority</span>
                    {isEditingPriority ? (
                      <select
                        value={currentPriority}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newPri = e.target.value as Priority;
                          setCurrentPriority(newPri);
                          setIsEditingPriority(false);
                          if (onUpdatePriority) {
                            onUpdatePriority(initialIncident.id, newPri);
                          }
                          showToast(`Priority updated to ${newPri}`);
                        }}
                        onBlur={() => setIsEditingPriority(false)}
                        className="bg-white border border-cyan-400 rounded text-xs font-bold text-gray-900 outline-none p-0.5 cursor-pointer"
                      >
                        <option value="Critical">Critical (P1)</option>
                        <option value="High">High (P2)</option>
                        <option value="Medium">Medium (P3)</option>
                        <option value="Low">Low (P4)</option>
                      </select>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 block group-hover:text-cyan-600 flex items-center gap-1">
                        {currentPriority}
                        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 font-normal">▾</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Impacted Locations */}
                <div
                  onClick={() => setIsEditingLocation(true)}
                  className="bg-white border border-gray-200/80 hover:border-cyan-400 rounded-xl p-3.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all relative group active:scale-98"
                  title="Click to select location option"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-gray-500 font-medium block">Impacted Locations</span>
                    {isEditingLocation ? (
                      <select
                        value={currentLocation}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setCurrentLocation(e.target.value);
                          setIsEditingLocation(false);
                          showToast(`Location set to ${e.target.value}`);
                        }}
                        onBlur={() => setIsEditingLocation(false)}
                        className="bg-white border border-cyan-400 rounded text-xs font-bold text-gray-900 outline-none p-0.5 cursor-pointer"
                      >
                        <option value="Site 1">Site 1 (HQ)</option>
                        <option value="Site 2">Site 2</option>
                        <option value="Site 3">Site 3 (EMEA)</option>
                        <option value="Global Cloud">Global Cloud</option>
                      </select>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 block group-hover:text-cyan-600 flex items-center gap-1">
                        {currentLocation}
                        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 font-normal">▾</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Impacted Customers */}
                <div
                  onClick={() => {
                    const next = currentCustomerCount >= 5 ? 1 : currentCustomerCount + 1;
                    setCurrentCustomerCount(next);
                    showToast(`Impacted customers: ${next}`);
                  }}
                  className="bg-white border border-gray-200/80 hover:border-cyan-400 rounded-xl p-3.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all group active:scale-98"
                  title="Click to toggle customer impact count"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium block">Impacted Customers</span>
                    <span className="text-sm font-bold text-gray-900 block group-hover:text-cyan-600">
                      {currentCustomerCount}
                    </span>
                  </div>
                </div>

                {/* 4. MI Manager */}
                <div
                  onClick={() => setIsEditingAssignee(true)}
                  className="bg-white border border-gray-200/80 hover:border-cyan-400 rounded-xl p-3.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all relative group active:scale-98"
                  title="Click to reassign commander option"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-gray-500 font-medium block">MI Manager</span>
                    {isEditingAssignee ? (
                      <select
                        value={currentAssignee}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newCommander = e.target.value;
                          setCurrentAssignee(newCommander);
                          setIsEditingAssignee(false);
                          if (onReassignCommander) {
                            onReassignCommander(initialIncident.id, newCommander);
                          }
                          showToast(`Commander assigned to ${newCommander}`);
                        }}
                        onBlur={() => setIsEditingAssignee(false)}
                        className="bg-white border border-cyan-400 rounded text-xs font-bold text-gray-900 outline-none p-0.5 cursor-pointer max-w-[120px]"
                      >
                        <option value="">Select Agent</option>
                        <option value="Admin">Admin</option>
                        <option value="Unassigned">Unassigned</option>
                      </select>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 block truncate max-w-[120px] group-hover:text-cyan-600 flex items-center gap-1">
                        {currentAssignee}
                        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 font-normal">▾</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Impact Statement Box (Editable) */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-wide">
                    Impact Statement
                  </h3>
                  <button
                    onClick={() => setIsEditingImpactStatement((e) => !e)}
                    className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-800 cursor-pointer active:scale-95"
                  >
                    {isEditingImpactStatement ? 'Done' : 'Edit'}
                  </button>
                </div>
                {isEditingImpactStatement ? (
                  <textarea
                    rows={2}
                    value={impactStatement}
                    onChange={(e) => setImpactStatement(e.target.value)}
                    className="w-full text-xs text-gray-800 p-2 border border-cyan-300 rounded-lg outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                ) : (
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {impactStatement}
                  </p>
                )}
              </div>

              {/* Work Activity Section */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs space-y-4 relative">
                {/* Header with Title + Action Buttons */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Work Activity</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setWorkActivityTab('business');
                        setActiveActionModal('add_task');
                      }}
                      className="bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer active:scale-95"
                    >
                      + Business Task
                    </button>
                    <button
                      onClick={() => {
                        setWorkActivityTab('technical');
                        setActiveActionModal('add_task');
                      }}
                      className="bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer active:scale-95"
                    >
                      + Technical Task
                    </button>
                  </div>
                </div>

                {/* Subtabs: Technical (4) & Business (4) */}
                <div className="flex items-center gap-1 border-b border-gray-100 pb-1">
                  <button
                    onClick={() => {
                      setWorkActivityTab('technical');
                      if (activeTab.startsWith('Business')) {
                        setActiveTab(`Technical (${technicalTasks.length})`);
                      }
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                      workActivityTab === 'technical'
                        ? 'bg-[#e8edf5] text-gray-800'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    Technical ({technicalTasks.length})
                  </button>
                  <button
                    onClick={() => {
                      setWorkActivityTab('business');
                      if (activeTab.startsWith('Technical')) {
                        setActiveTab(`Business (${businessTasks.length})`);
                      }
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                      workActivityTab === 'business'
                        ? 'bg-[#e8edf5] text-gray-800'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    Business ({businessTasks.length})
                  </button>
                </div>

                {/* Bulk Actions Floating Bar (appears when rows are checked!) */}
                {selectedTaskCount > 0 && (
                  <div className="bg-cyan-900 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <span className="font-semibold">{selectedTaskCount} tasks selected</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBulkStatusChange('Completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange('In Progress')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        ▶ In Progress
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        🗑 Delete
                      </button>
                      <button
                        onClick={handleBulkClear}
                        className="bg-cyan-800 hover:bg-cyan-700 text-white px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Work Activity Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100 pb-2">
                        <th className="py-2.5 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={currentTaskList.length > 0 && currentTaskList.every((t) => t.checked)}
                            className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (workActivityTab === 'technical') {
                                setTechnicalTasks((prev) => prev.map((t) => ({ ...t, checked })));
                              } else {
                                setBusinessTasks((prev) => prev.map((t) => ({ ...t, checked })));
                              }
                            }}
                          />
                        </th>
                        <th className="py-2.5 px-3 font-semibold">ID</th>
                        <th className="py-2.5 px-3 font-semibold">Team</th>
                        <th className="py-2.5 px-3 font-semibold">Summary</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {currentTaskList.map((task) => (
                        <tr
                          key={task.id}
                          className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                          onClick={() => toggleTaskCheck(task.id, workActivityTab)}
                        >
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={Boolean(task.checked)}
                              onChange={() => toggleTaskCheck(task.id, workActivityTab)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-gray-700">
                            {task.id}
                          </td>
                          <td className="py-3 px-3 text-gray-700 font-medium">
                            {task.team === '1st Line Support' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/team/1st-line-live');
                                }}
                                title="Open 1st Line Support Queue"
                                className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-semibold hover:underline cursor-pointer"
                              >
                                <span>{task.team}</span>
                                <span className="text-[10px] text-cyan-500">↗</span>
                              </button>
                            ) : task.team === '2nd Line Support' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/team/2nd-line-live');
                                }}
                                title="Open 2nd Line Support Queue"
                                className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-semibold hover:underline cursor-pointer"
                              >
                                <span>{task.team}</span>
                                <span className="text-[10px] text-cyan-500">↗</span>
                              </button>
                            ) : (
                              task.team
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTask(task);
                              }}
                              className="text-cyan-600 hover:text-cyan-800 font-semibold group-hover:underline text-left cursor-pointer"
                            >
                              {task.summary}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setActiveTaskStatusDropdown((cur) => (cur === task.id ? null : task.id))
                              }
                              title="Click for Status options"
                              className={`inline-block px-3 py-0.5 rounded text-[11px] font-semibold text-white cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                                task.status === 'New'
                                  ? 'bg-[#184a2c]'
                                  : task.status === 'In Progress'
                                  ? 'bg-[#0284c7]'
                                  : task.status === 'Recovery'
                                  ? 'bg-[#b45309]'
                                  : 'bg-[#059669]'
                              }`}
                            >
                              {task.status} ▾
                            </button>

                            {/* Status options dropdown */}
                            {activeTaskStatusDropdown === task.id && (
                              <div className="absolute left-1/2 -translate-x-1/2 top-8 w-32 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 text-left text-[11px] font-medium text-gray-700">
                                {(['New', 'In Progress', 'Recovery', 'Diagnosis', 'Completed', 'Blocked'] as WorkTask['status'][]).map(
                                  (st) => (
                                    <button
                                      key={st}
                                      onClick={() => updateTaskStatus(task.id, st, workActivityTab)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between cursor-pointer"
                                    >
                                      <span>{st}</span>
                                      {task.status === st && <span className="text-cyan-500 font-bold">✓</span>}
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {task.activity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ═══════ RIGHT COLUMN (4 cols): SLA, Impacted CIs, Latest Activity, AI Floating ═══════ */}
            <div className="lg:col-span-4 space-y-4">
              {/* 1. Major Incident SLA Breach Widget */}
              <div
                onClick={() => setActiveActionModal('sla_breakdown')}
                className="bg-[#ea2e2e] text-white rounded-xl p-4 shadow-sm relative overflow-hidden cursor-pointer hover:opacity-95 transition-all group"
                title="Click to view detailed SLA Breakdown"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                    Major Incident SLA
                  </div>
                  <span className="text-[10px] text-white/80 group-hover:underline">View Breakdown →</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-white/95">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                      <span>Response Target: 29/08/2026 2:29 AM</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/95">
                      <span className="w-4 h-4 rounded-full bg-red-800 text-white flex items-center justify-center text-[10px] font-bold">
                        ✕
                      </span>
                      <span>Resolution Target: 09/09/2026 10:29 PM</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight shrink-0 pl-2">
                    -179:07
                  </div>
                </div>
              </div>

              {/* 2. Impacted CIs Card */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Impacted CIs
                  </h3>
                  <button
                    onClick={() => setActiveActionModal('ci_details')}
                    className="text-[10px] text-cyan-600 hover:text-cyan-800 font-bold hover:underline cursor-pointer"
                  >
                    View CI Info →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100 pb-1 text-[11px]">
                        <th className="py-1 px-2 w-6">
                          <input type="checkbox" className="rounded text-cyan-500 cursor-pointer" />
                        </th>
                        <th className="py-1 px-2 font-semibold">CI Type</th>
                        <th className="py-1 px-2 font-semibold">CI Tag</th>
                        <th className="py-1 px-2 font-semibold text-right">Health Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        onClick={() => setActiveActionModal('ci_details')}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded text-cyan-500 cursor-pointer" />
                        </td>
                        <td className="py-2 px-2 flex items-center gap-1.5 font-medium text-gray-800">
                          <span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            ⚙
                          </span>
                          <span className="truncate max-w-[110px]" title="Business App Instance">
                            Business App Inst...
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-600 truncate max-w-[100px]" title={editProduct}>
                          {editProduct || 'MyFinance PROD'}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Online
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] border-t border-gray-100">
                  <button
                    onClick={() => navigate('/cmdb/services')}
                    className="text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>🗺️</span> View CMDB Topology Map →
                  </button>
                  <button
                    onClick={() => navigate('/cmdb')}
                    className="text-gray-500 hover:text-gray-800 font-medium hover:underline cursor-pointer"
                  >
                    All Assets →
                  </button>
                </div>
              </div>

              {/* 3. Latest Activity Card */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Latest Activity
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setNoteType('internal');
                        setIsNoteModalOpen(true);
                      }}
                      className="bg-[#78be20] hover:bg-[#6aa81c] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>✎</span> Internal Note
                    </button>
                    <button
                      onClick={() => {
                        setNoteType('external');
                        setIsNoteModalOpen(true);
                      }}
                      className="bg-[#f59e0b] hover:bg-[#d97706] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>✎</span> External Note
                    </button>
                  </div>
                </div>

                {/* Activity List */}
                <div className="space-y-3 pt-1">
                  {activities.map((act) => (
                    <div key={act.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            Q
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                              <span>{act.author}</span>
                              <span className="text-gray-400 font-normal">|</span>
                              <span className="text-cyan-700">{act.type}</span>
                              <span className="text-gray-400 text-[10px]">📎</span>
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2">
                              <span>Time Taken: {act.timeTaken}</span>
                              {act.edited && <span>• Edited</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{act.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed pl-8">
                        {act.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. AI Suggested Articles Dark Widget */}
              {isAiArticlesOpen ? (
                <div className="bg-[#24282d] text-white rounded-xl p-3.5 shadow-2xl border border-gray-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                      AI Suggested Articles
                    </span>
                    <button
                      onClick={() => setIsAiArticlesOpen(false)}
                      title="Hide AI Suggestions"
                      className="text-gray-400 hover:text-white text-xs w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Filter Icon Pill Buttons Row (Interactive Filter Options) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setAiFilterCategory(aiFilterCategory === 'kb' ? 'all' : 'kb');
                        showToast('Filtered by Knowledge Base Articles');
                      }}
                      title="Knowledge Articles"
                      className={`w-7 h-7 rounded text-white flex items-center justify-center text-xs transition-all cursor-pointer active:scale-95 ${
                        aiFilterCategory === 'kb' ? 'bg-[#4d7c0f] ring-2 ring-white scale-105' : 'bg-[#65a30d] hover:bg-[#4d7c0f]'
                      }`}
                    >
                      💾
                    </button>
                    <button
                      onClick={() => {
                        setAiFilterCategory(aiFilterCategory === 'urgent' ? 'all' : 'urgent');
                        showToast('Filtered by Urgent Workarounds');
                      }}
                      title="Urgent Workarounds"
                      className={`w-7 h-7 rounded text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        aiFilterCategory === 'urgent' ? 'bg-[#991b1b] ring-2 ring-white scale-105' : 'bg-[#dc2626] hover:bg-[#b91c1c]'
                      }`}
                    >
                      !
                    </button>
                    <button
                      onClick={() => {
                        setAiFilterCategory(aiFilterCategory === 'tickets' ? 'all' : 'tickets');
                        showToast('Filtered by Related Tickets');
                      }}
                      title="Related Tickets"
                      className={`w-7 h-7 rounded text-white flex items-center justify-center text-xs transition-all cursor-pointer active:scale-95 ${
                        aiFilterCategory === 'tickets' ? 'bg-[#9a3412] ring-2 ring-white scale-105' : 'bg-[#ea580c] hover:bg-[#c2410c]'
                      }`}
                    >
                      🎫
                    </button>
                    <button
                      onClick={() => {
                        setAiFilterCategory(aiFilterCategory === 'approved' ? 'all' : 'approved');
                        showToast('Filtered by Approved Solutions');
                      }}
                      title="Approved Solutions"
                      className={`w-7 h-7 rounded text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        aiFilterCategory === 'approved' ? 'bg-[#075985] ring-2 ring-white scale-105' : 'bg-[#0284c7] hover:bg-[#0369a1]'
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setAiFilterCategory(aiFilterCategory === 'restricted' ? 'all' : 'restricted');
                        showToast('Filtered by Restricted Actions');
                      }}
                      title="Restricted & Prohibited Actions"
                      className={`w-7 h-7 rounded text-gray-300 flex items-center justify-center text-xs transition-all cursor-pointer active:scale-95 ${
                        aiFilterCategory === 'restricted' ? 'bg-[#111827] ring-2 ring-white scale-105' : 'bg-[#374151] hover:bg-[#1f2937]'
                      }`}
                    >
                      ⊘
                    </button>
                  </div>

                  {/* Articles List */}
                  <div className="space-y-1.5 pt-1">
                    {filteredArticles.slice(0, 4).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => {
                          setSelectedKbArticle(art);
                          setIsKbModalOpen(true);
                        }}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group active:scale-98"
                      >
                        <span className="w-5 h-5 rounded bg-[#65a30d] text-white flex items-center justify-center text-[10px] shrink-0">
                          💾
                        </span>
                        <span className="text-xs text-gray-200 group-hover:text-cyan-300 font-medium truncate">
                          {art.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAiArticlesOpen(true)}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  <span>✨</span> Show AI Suggested Articles ({ALL_KB_ARTICLES.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: DETAILS VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Details' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Incident Details & System Metadata</h2>
                <p className="text-xs text-gray-500">Comprehensive classification, affected assets, and SLA targets</p>
              </div>
              <button
                onClick={() => setActiveActionModal('edit_details')}
                className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer active:scale-95"
              >
                ✏️ Edit Fields
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Incident ID</span>
                  <span className="font-mono font-bold text-gray-800 text-sm">#{initialIncident.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Classification</span>
                  <span className="font-semibold text-gray-800">P1 Major Service Disruption</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Priority Level</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    {currentPriority}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Configuration Item (CI)</span>
                  <span className="font-semibold text-gray-800">{editProduct}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Service Impact</span>
                  <span className="font-semibold text-gray-800">Corporate Single Sign-On (SSO) Portal</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Assigned Commander</span>
                  <span className="font-semibold text-gray-800">{currentAssignee}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Response Target</span>
                  <span className="font-semibold text-gray-800">29/08/2026 2:29 AM (Met)</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Resolution SLA</span>
                  <span className="font-semibold text-red-600 font-bold">Breached (-179:07)</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Impacted Location</span>
                  <span className="font-semibold text-gray-800">{currentLocation}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <span className="text-gray-400 block uppercase font-bold text-[10px]">Symptom Description</span>
              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                Multiple users report HTTP 504 gateway timeout upon entering credentials on the primary corporate portal. Root cause analysis points to session token cache lock contention on identity cluster nodes.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: PROGRESS TIMELINE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Progress' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Incident Milestone & Progress Timeline</h2>
                <p className="text-xs text-gray-500">Live lifecycle tracking from initiation to remediation</p>
              </div>
              <button
                onClick={() => {
                  setNoteType('update');
                  setIsNoteModalOpen(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer active:scale-95"
              >
                + Record Milestone
              </button>
            </div>

            <div className="relative pl-6 space-y-6 border-l-2 border-cyan-200 ml-3">
              {currentStages.map((st, i) => (
                <div key={st.label} className="relative cursor-pointer" onClick={() => handleChevronClick(i)}>
                  <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                    st.isActive ? 'bg-cyan-500 ring-4 ring-cyan-100' : st.isCompleted ? 'bg-emerald-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <span className="text-xs font-bold text-gray-800">{st.label} Phase</span>
                    <span className="text-[10px] text-gray-400 ml-2">{st.timestamp || 'Pending Stage'}</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {i === 0 && 'Incident declared and response team mobilized.'}
                      {i === 1 && 'Incident escalated to Tier 3 Infrastructure engineering.'}
                      {i === 2 && 'Identity provider session token serialization issue diagnosed.'}
                      {i === 3 && 'SSO version rolled back and gateway caches purged.'}
                      {i === 4 && 'User access restored, synthetic tests verified.'}
                      {i === 5 && 'Formal Post-Incident Review (PIR) signed off.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: IMPACT ASSESSMENT
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Impact' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-4">
              Comprehensive Impact Assessment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-red-600">User Productivity Impact</span>
                <div className="text-xl font-bold text-red-700">420 Users</div>
                <p className="text-xs text-red-600">Users blocked from login on MyFinance ERP</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-600">Financial Risk</span>
                <div className="text-xl font-bold text-amber-700">Medium Severity</div>
                <p className="text-xs text-amber-600">No payment transaction losses reported</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-600">Customer Accounts</span>
                <div className="text-xl font-bold text-purple-700">{currentCustomerCount} Corporate Org</div>
                <p className="text-xs text-purple-600">Acme Global Corporation ({currentLocation})</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 5: CONTRIBUTORS VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Contributors' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Incident War-Room Contributors</h2>
              <button
                onClick={() => setActiveActionModal('contributors')}
                className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer active:scale-95"
              >
                + Add Contributor
              </button>
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center">DU</div>
                  <div>
                    <span className="font-bold text-gray-900 block">{currentAssignee}</span>
                    <span className="text-gray-500 text-[11px]">Incident Commander · Service Desk</span>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Active Lead</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center">AD</div>
                  <div>
                    <span className="font-bold text-gray-900 block">Admin (You)</span>
                    <span className="text-gray-500 text-[11px]">System Administrator · IT Infrastructure</span>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Active</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center">OC</div>
                  <div>
                    <span className="font-bold text-gray-900 block">Identity Provider On-Call</span>
                    <span className="text-gray-500 text-[11px]">Tier 3 Escalation · Security Operations</span>
                  </div>
                </div>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">On Call</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 6: VIEW LOG / AUDIT TRAIL
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'View Log' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Full System Audit Trail & Events
            </h2>
            <div className="space-y-2 text-xs font-mono">
              {activities.map((a) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between">
                  <div>
                    <span className="text-cyan-700 font-bold">[{a.date}]</span>{' '}
                    <span className="text-gray-900 font-bold">{a.author}:</span>{' '}
                    <span className="text-gray-700">{a.content}</span>
                  </div>
                  <span className="text-gray-400 text-[10px] shrink-0 pl-3">{a.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 7: RELATED CIS (CMDB)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Related CIs' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              CMDB Configuration Items & Infrastructure Topology
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div
                onClick={() => setActiveActionModal('ci_details')}
                className="p-4 rounded-xl border border-gray-200 space-y-1 hover:border-cyan-400 cursor-pointer transition-colors"
              >
                <span className="font-bold text-gray-900 block">🖥️ {editProduct}</span>
                <span className="text-gray-500 text-[11px]">Type: Business Application Instance</span>
                <div className="text-emerald-600 font-bold text-[10px] pt-1">● Online (Degraded Gateway)</div>
              </div>
              <div
                onClick={() => setActiveActionModal('ci_details')}
                className="p-4 rounded-xl border border-gray-200 space-y-1 hover:border-cyan-400 cursor-pointer transition-colors"
              >
                <span className="font-bold text-gray-900 block">🔐 auth.identity.corp</span>
                <span className="text-gray-500 text-[11px]">Type: SAML / OAuth SSO Gateway</span>
                <div className="text-amber-600 font-bold text-[10px] pt-1">● Session Token Cache Contention</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => navigate('/cmdb/services')}
                className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                🗺️ Open CMDB Services Map →
              </button>
              <button
                onClick={() => navigate('/cmdb')}
                className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                ⚙️ Browse All CMDB Assets →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 8: NOTIFICATION LOG
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Notification Log' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Broadcast & Stakeholder Notification Logs
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Emergency War-Room Channel Created</span>
                  <span className="text-gray-500 text-[11px]">Dispatched to Slack, Teams, and On-Call SMS</span>
                </div>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Delivered</span>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Customer Advisory Notice #1</span>
                  <span className="text-gray-500 text-[11px]">Sent to Acme Global Corp account representatives</span>
                </div>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Delivered</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 1: Update Progress Note Modal (Image 3)
      ═══════════════════════════════════════════════════════════════════ */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150 ${
            isNoteFullscreen ? 'w-[95vw] h-[92vh] flex flex-col' : 'w-full max-w-xl'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-400 text-white font-bold text-xs flex items-center justify-center">
                  Q
                </div>
                <div className="text-sm font-bold text-gray-900">
                  <span className="text-amber-600">{currentAssignee}</span>
                  <span className="text-gray-400 mx-1.5">|</span>
                  <span>Update Progress</span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('File attachment picker ready')}
                  title="Attach file"
                  className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                >
                  📎
                </button>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Rich WYSIWYG Editor Toolbar + Textarea */}
            <div className={`p-6 space-y-4 ${isNoteFullscreen ? 'flex-1 flex flex-col' : ''}`}>
              <div className={`border border-gray-200 rounded-xl overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all ${
                isNoteFullscreen ? 'flex-1 flex flex-col' : ''
              }`}>
                {/* Formatting Toolbar (Active Formatting Options) */}
                <div className="bg-gray-50 border-b border-gray-200 p-2 space-y-1.5 select-none relative">
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsNoteFullscreen((f) => !f)}
                      title="Toggle Fullscreen"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      ⛶
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('### ')}
                      title="Font size / Heading"
                      className="p-1 hover:bg-gray-200 rounded font-bold cursor-pointer"
                    >
                      A▾
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('---')}
                      title="Alignment / Divider"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      ≡▾
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('• ')}
                      title="Bullet list"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      •≡▾
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('1. ')}
                      title="Numbered list"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      1.▾
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('> ')}
                      title="Quote"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      ❝▾
                    </button>
                    <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('[Incident Link](https://servigen.io)')}
                      title="Insert Link"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('![Architecture Screenshot](https://)')}
                      title="Insert Image"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      🖼️
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('| Metric | Value |\n|---|---|\n| Stage | Mitigated |')}
                      title="Insert Table"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      ⊞
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen((o) => !o)}
                      title="Insert Emoji"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      🙂
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('\n\n')}
                      title="Line Spacing"
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      ⇕
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('**Important Action:** ')}
                      title="Insert Bold Element"
                      className="p-1 hover:bg-gray-200 rounded font-bold cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('---')}
                      title="Horizontal Rule"
                      className="p-1 hover:bg-gray-200 rounded font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('~~resolved issue~~')}
                      title="Strikethrough"
                      className="p-1 hover:bg-gray-200 rounded line-through cursor-pointer"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('```bash\nkubectl rollout restart deployment/auth-gateway\n```')}
                      title="Code Block"
                      className="p-1 hover:bg-gray-200 rounded font-mono cursor-pointer"
                    >
                      &lt; &gt;
                    </button>
                  </div>

                  {/* Emoji Quick Picker */}
                  {isEmojiPickerOpen && (
                    <div className="absolute left-2 top-16 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 flex gap-2 text-base">
                      {['⚠️', '✅', '❌', '🚀', '⏱️', '🔥', '💡', '👍', '🔍', '🔒'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            insertTextAtCursor(emoji);
                            setIsEmojiPickerOpen(false);
                          }}
                          className="hover:scale-125 transition-transform cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  rows={isNoteFullscreen ? 16 : 5}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter your note here"
                  className="w-full p-4 text-xs text-gray-800 placeholder-gray-400 outline-none resize-none flex-1"
                  autoFocus
                />
              </div>

              {/* Time Taken Row */}
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-gray-700">Time Taken</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={2}
                    value={hoursTaken}
                    onChange={(e) => setHoursTaken(e.target.value.replace(/\D/g, ''))}
                    className="w-10 h-7 text-center border border-gray-300 rounded text-xs font-mono font-bold focus:border-cyan-400 outline-none"
                  />
                  <span className="text-gray-400 font-bold">:</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={minutesTaken}
                    onChange={(e) => setMinutesTaken(e.target.value.replace(/\D/g, ''))}
                    className="w-10 h-7 text-center border border-gray-300 rounded text-xs font-mono font-bold focus:border-cyan-400 outline-none"
                  />
                  <span className="text-cyan-500 text-sm ml-1">🕒</span>
                </div>
              </div>

              {/* Buttons: Save & Discard */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-semibold px-7 py-2 rounded-full shadow-xs transition-colors cursor-pointer active:scale-95"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-6 py-2 rounded-full transition-colors cursor-pointer active:scale-95"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 2: Knowledge Base / AI Articles Popover (Image 4)
      ═══════════════════════════════════════════════════════════════════ */}
      {isKbModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Search Header with Dropdown Options */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/70">
              <div className="flex items-center flex-1 max-w-md border border-cyan-400 rounded-md overflow-visible bg-white shadow-2xs relative">
                <button
                  type="button"
                  onClick={() => setIsKbCategoryDropdownOpen((o) => !o)}
                  className="bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-2 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{kbCategory}</span>
                  <span className="text-[10px]">▾</span>
                </button>

                {isKbCategoryDropdownOpen && (
                  <div className="absolute left-0 top-10 w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 text-xs font-medium text-gray-700">
                    {['All', 'Knowledge Articles', 'Urgent Workarounds', 'Related Tickets', 'Approved Runbooks'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setKbCategory(cat);
                          setIsKbCategoryDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1">
                  <span className="bg-gray-100 text-gray-700 text-[11px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                    <span>{kbSearchQuery}</span>
                    <button
                      onClick={() => setKbSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </span>
                  <input
                    type="text"
                    value={kbSearchQuery}
                    onChange={(e) => setKbSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="flex-1 text-xs outline-none bg-transparent"
                  />
                  <span className="text-cyan-500 font-bold text-sm">🔍</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsKbModalOpen(false);
                  setSelectedKbArticle(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Articles List or Selected Article Reader View */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 mi-console-scroll">
              {selectedKbArticle ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedKbArticle(null)}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Articles List
                  </button>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                    <h3 className="text-base font-bold text-gray-900">{selectedKbArticle.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedKbArticle.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed border-t border-gray-200 pt-3">
                      {selectedKbArticle.fullContent || selectedKbArticle.snippet}
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showToast('Thank you for your feedback!')}
                          className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-md cursor-pointer"
                        >
                          👍 Helpful ({selectedKbArticle.helpful})
                        </button>
                        <button
                          onClick={() => showToast('Feedback recorded')}
                          className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-md cursor-pointer"
                        >
                          👎 Not Helpful
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setNoteContent((prev) => `${prev}\n\n**Referenced Solution (${selectedKbArticle.title}):**\n${selectedKbArticle.fullContent || selectedKbArticle.snippet}`);
                          setIsKbModalOpen(false);
                          setIsNoteModalOpen(true);
                          showToast('Article content inserted into note');
                        }}
                        className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold rounded-full cursor-pointer"
                      >
                        Insert into Progress Note →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                displayedKbArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedKbArticle(art)}
                    className="p-4 rounded-xl border border-gray-100 bg-white hover:border-cyan-200 hover:shadow-xs transition-all space-y-2.5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-cyan-500 text-base mt-0.5">🔗</span>
                        <div>
                          <h4 className="text-sm font-bold text-cyan-600 hover:text-cyan-700 hover:underline">
                            {art.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {art.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5 text-xs font-semibold">
                        <div className="text-gray-400">{art.views}</div>
                        <div className="text-emerald-600">{art.helpful}</div>
                        <div className="text-[11px] font-mono text-gray-500">{art.score}</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed pl-7">
                      {art.snippet}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs shrink-0">
              <span className="text-gray-500">Need full authoring or article drafting tools?</span>
              <button
                type="button"
                onClick={() => {
                  setIsKbModalOpen(false);
                  navigate('/article-drafts');
                }}
                className="text-cyan-600 hover:text-cyan-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>📝</span> Browse Article Drafts & Knowledge Base →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 3: Add Task Modal (+ Technical / Business Task)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'add_task' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">
                + Add {workActivityTab === 'technical' ? 'Technical' : 'Business'} Task
              </h3>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Task Summary</label>
                <input
                  type="text"
                  required
                  value={newTaskSummary}
                  onChange={(e) => setNewTaskSummary(e.target.value)}
                  placeholder="e.g. Purge session cache on auth gateway"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Assigned Team</label>
                  <select
                    value={newTaskTeam}
                    onChange={(e) => setNewTaskTeam(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="1st Line Support">1st Line Support</option>
                    <option value="2nd Line Support">2nd Line Support</option>
                    <option value="Finance Operations">Finance Operations</option>
                    <option value="Customer Success">Customer Success</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Activity Type</label>
                  <select
                    value={newTaskActivity}
                    onChange={(e) => setNewTaskActivity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Diagnosis">Diagnosis</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Communication">Communication</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Briefing">Briefing</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-cyan-400 hover:bg-cyan-500 text-white font-semibold cursor-pointer active:scale-95"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 4: Task Edit Details Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">
                  {editingTask.id}
                </span>
                <h3 className="text-sm font-bold text-gray-900">Edit Task</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Task Summary</label>
                <input
                  type="text"
                  value={editingTask.summary}
                  onChange={(e) => setEditingTask({ ...editingTask, summary: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Diagnosis">Diagnosis</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Activity</label>
                  <select
                    value={editingTask.activity}
                    onChange={(e) => setEditingTask({ ...editingTask, activity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Diagnosis">Diagnosis</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Communication">Communication</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Briefing">Briefing</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingTask.type === 'technical') {
                    setTechnicalTasks((prev) => prev.map((t) => (t.id === editingTask.id ? editingTask : t)));
                  } else {
                    setBusinessTasks((prev) => prev.map((t) => (t.id === editingTask.id ? editingTask : t)));
                  }
                  setEditingTask(null);
                  showToast('Task updated successfully');
                }}
                className="px-5 py-2 rounded-full bg-[#13273e] hover:bg-[#0c1a2b] text-white font-semibold cursor-pointer active:scale-95"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 5: Edit Incident Details Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'edit_details' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">✏️ Edit Major Incident Details</h3>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Incident Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Priority</label>
                  <select
                    value={currentPriority}
                    onChange={(e) => setCurrentPriority(e.target.value as Priority)}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Critical">Critical (P1)</option>
                    <option value="High">High (P2)</option>
                    <option value="Medium">Medium (P3)</option>
                    <option value="Low">Low (P4)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Product / CI</label>
                  <input
                    type="text"
                    value={editProduct}
                    onChange={(e) => setEditProduct(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">MI Manager</label>
                  <select
                    value={currentAssignee}
                    onChange={(e) => setCurrentAssignee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="">Select Agent</option>
                    <option value="Admin">Admin</option>
                    <option value="Unassigned">Unassigned</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Location</label>
                  <select
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Site 1">Site 1</option>
                    <option value="Site 2">Site 2</option>
                    <option value="Site 3">Site 3</option>
                    <option value="Global Cloud">Global Cloud</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Impact Statement</label>
                <textarea
                  rows={2}
                  value={impactStatement}
                  onChange={(e) => setImpactStatement(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveActionModal(null);
                  showToast('Incident details updated');
                }}
                className="px-5 py-2 rounded-full bg-[#13273e] hover:bg-[#0c1a2b] text-white font-semibold cursor-pointer active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 6: Get Started / Interactive Playbook Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'get_started' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="text-base font-bold text-gray-900">Major Incident Command Center Tour</h3>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                <span className="font-bold text-cyan-800 block mb-1">Step 1: Incident Assessment & Chevrons</span>
                Click any stage in the top chevron bar (Started, Diagnosed, Mitigated, Resolved) to advance the incident's lifecycle state in real-time.
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="font-bold text-purple-800 block mb-1">Step 2: Assign & Manage Tasks</span>
                Use the <span className="font-semibold">+ Business Task</span> and <span className="font-semibold">+ Technical Task</span> buttons to coordinate response actions across Infrastructure, Support, and Executive teams.
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="font-bold text-emerald-800 block mb-1">Step 3: Real-Time Stakeholder Communications</span>
                Log updates via <span className="font-semibold">Internal Note</span> and <span className="font-semibold">External Note</span>, or broadcast to corporate Slack/Teams channels using the <span className="font-semibold">Communications</span> button.
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setActiveActionModal(null);
                  showToast('You are ready to manage Major Incidents!');
                }}
                className="px-6 py-2 rounded-full bg-[#13273e] hover:bg-[#0c1a2b] text-white font-semibold text-xs cursor-pointer active:scale-95"
              >
                Got It, Let's Go!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 7: Notifications Dropdown / Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'notifications' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span>🔔</span>
                <h3 className="text-sm font-bold text-gray-900">Incident Alerts & Notifications</h3>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl border border-red-200 bg-red-50/60 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-red-900 block">Resolution Target SLA Breached</span>
                  <span className="text-red-700 text-[11px]">SLA breached by -179:07. On-call escalation notified.</span>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/60 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-cyan-900 block">420 Users Affected at Site 2</span>
                  <span className="text-cyan-700 text-[11px]">MyFinance SSO authentication failure reported.</span>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-gray-400 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-gray-800 block">War-Room Bridge Active</span>
                  <span className="text-gray-600 text-[11px]">8 engineers and coordinators on call.</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => showToast('All notifications marked as read')}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer"
              >
                Mark all as read
              </button>
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 8: Tasks Modal (Top header 📋 icon)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'tasks' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span>📋</span>
                <h3 className="text-sm font-bold text-gray-900">Assigned War-Room Action Tasks</h3>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { id: 't1', label: 'Purge session cache on auth gateway', done: false },
                { id: 't2', label: 'Rollback SSO configuration to v2.4.1', done: true },
                { id: 't3', label: 'Broadcast customer advisory bulletin #2', done: false },
                { id: 't4', label: 'Verify synthetic login on EMEA staging node', done: true },
              ].map((task) => (
                <div key={task.id} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={task.done} className="rounded text-cyan-500 cursor-pointer" />
                    <span className={task.done ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}>
                      {task.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.done ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-700'
                  }`}>
                    {task.done ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-5 py-1.5 rounded-full bg-cyan-400 hover:bg-cyan-500 text-white font-semibold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 9: SLA Breakdown Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'sla_breakdown' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span>⏱️</span>
                <h3 className="text-sm font-bold text-gray-900">Major Incident SLA Breakdown</h3>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Response Target SLA</span>
                  <div className="text-sm font-bold text-emerald-800">29/08/2026 2:29 AM</div>
                  <span className="text-emerald-600 font-semibold text-[11px]">Met in 14 minutes</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-red-700 block">Resolution Target SLA</span>
                  <div className="text-sm font-bold text-red-800">09/09/2026 10:29 PM</div>
                  <span className="text-red-600 font-semibold text-[11px]">Breached by -179h 07m</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Hours Schedule:</span>
                  <span className="font-semibold text-gray-800">24x7 365 Days Mission Critical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Elapsed Time:</span>
                  <span className="font-semibold text-gray-800">183 Hours 07 Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target Resolution Time:</span>
                  <span className="font-semibold text-gray-800">4 Hours (P1 Target)</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  showToast('SLA Pause requested pending 3rd party vendor reply');
                  setActiveActionModal(null);
                }}
                className="px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
              >
                Request SLA Pause
              </button>
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-5 py-1.5 rounded-full bg-cyan-400 hover:bg-cyan-500 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 10: Performance / Health / Timesheet / Help / Profile Modals
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'performance' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">📊 Major Incident Performance SLA</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Response SLA</span>
                <div className="text-xl font-bold text-emerald-700">96.4%</div>
                <span className="text-[10px] text-emerald-600">Target: 95%</span>
              </div>
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                <span className="text-[10px] uppercase font-bold text-cyan-600">Resolution SLA</span>
                <div className="text-xl font-bold text-cyan-700">88.2%</div>
                <span className="text-[10px] text-cyan-600">Target: 85%</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeActionModal === 'health' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">📡 System & Service Health</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Identity SSO Gateway', status: 'Degraded', color: 'bg-amber-500' },
                { name: 'Core Database Cluster', status: 'Operational', color: 'bg-emerald-500' },
                { name: 'MyFinance ERP API', status: 'Degraded', color: 'bg-amber-500' },
                { name: 'Payment Processing Service', status: 'Operational', color: 'bg-emerald-500' },
              ].map((svc) => (
                <div key={svc.name} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{svc.name}</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                    <span className={`w-2 h-2 rounded-full ${svc.color}`} />
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeActionModal === 'timesheet' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">🕒 Incident Timesheet Tracker</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="text-3xl font-mono font-bold text-gray-900">
                {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">Active War-Room Investigation Timer</div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setTimerRunning((r) => !r);
                    showToast(timerRunning ? 'Timer paused' : 'Timer started');
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold text-white cursor-pointer ${
                    timerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {timerRunning ? 'Pause Timer' : 'Start Timer'}
                </button>
                <button
                  onClick={() => {
                    setTimerSeconds(0);
                    setTimerRunning(false);
                    showToast('Timer reset');
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeActionModal === 'help' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">❓ Major Incident Response Flow (ITIL)</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <p>1. <strong>Triage & Severity:</strong> Classify business impact and declare P1.</p>
              <p>2. <strong>War-Room:</strong> Mobilize on-call engineers via Slack/Teams.</p>
              <p>3. <strong>Stakeholder Updates:</strong> Broadcast communications every 30 minutes.</p>
              <p>4. <strong>Mitigation:</strong> Isolate root cause, execute rollback or patch.</p>
              <p>5. <strong>RCA & PIR:</strong> Conduct Post-Incident Review within 5 business days.</p>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer">Understood</button>
            </div>
          </div>
        </div>
      )}

      {activeActionModal === 'profile' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">👤 User Profile</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500 text-white font-bold text-lg flex items-center justify-center">
                Q
              </div>
              <div>
                <span className="font-bold text-gray-900 block text-sm"></span>
                <span className="text-gray-500 text-xs"></span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {role} ● Online
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 11: CI Details Popup
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'ci_details' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span>⚙️</span>
                <h3 className="text-sm font-bold text-gray-900">Configuration Item (CI) Details</h3>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">CI Name:</span>
                <span className="font-bold text-gray-800">{editProduct}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">CI Type:</span>
                <span className="font-semibold text-gray-800">Business Application Instance</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Tier:</span>
                <span className="font-bold text-red-600">Tier 1 Mission Critical</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Primary Server Host:</span>
                <span className="font-mono text-gray-800">app-prod-02.internal</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Health Status:</span>
                <span className="text-emerald-600 font-bold">Online (Active Degradation)</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setActiveActionModal(null);
                  navigate('/cmdb/services');
                }}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer hover:underline"
              >
                🗺️ Open in CMDB Services Map →
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveActionModal(null);
                    navigate('/cmdb');
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                >
                  All Assets
                </button>
                <button onClick={() => setActiveActionModal(null)} className="px-4 py-1.5 rounded-full bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 12: Action Modals (Comms, Customers, Problem, Contributors)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeActionModal === 'comms' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">💬 Major Incident Communications</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="text-xs text-gray-700 space-y-3">
              <p className="text-gray-600 mb-2">Broadcast emergency bulletins to impacted channels and leadership teams:</p>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800 block">IT Leadership Slack & Teams Bridge</span>
                    <span className="text-gray-500 text-[11px]">Bridge active with 8 participants</span>
                  </div>
                  <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Connected</span>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800 block">Status Page Broadcast</span>
                    <span className="text-gray-500 text-[11px]">Status: Major Outage posted</span>
                  </div>
                  <span className="text-cyan-600 font-bold text-xs bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Published</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  showToast('Broadcast dispatched to corporate Slack & Teams bridges');
                  setActiveActionModal(null);
                }}
                className="px-4 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs cursor-pointer active:scale-95"
              >
                Send Bridge Broadcast
              </button>
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeActionModal === 'customers' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">⚠️ Impacted Customers</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="text-xs text-gray-700 space-y-3">
              <p className="text-gray-600">Currently 1 primary corporate entity impacted:</p>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-800">Acme Global Corporation</span>
                  <span className="text-gray-500 block text-[11px]">{currentLocation} — 420 active employees affected</span>
                </div>
                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[11px]">P1 High Impact</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  showToast('Customer advisory notice dispatched to account reps');
                  setActiveActionModal(null);
                }}
                className="px-4 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs cursor-pointer active:scale-95"
              >
                Dispatch Customer Advisory
              </button>
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeActionModal === 'problem' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">🔧 Link or Raise Problem Ticket</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs text-gray-700">
              <p className="text-gray-600">Associate an ongoing Problem record for Root Cause Analysis (RCA):</p>
              <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center space-y-2">
                <span className="text-xs font-semibold text-gray-700 block">No linked problem ticket yet</span>
                <button
                  onClick={() => {
                    showToast('Problem PRB0001048 created and linked to incident');
                    setActiveActionModal(null);
                  }}
                  className="px-4 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs cursor-pointer active:scale-95"
                >
                  + Create Linked Problem Record
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setActiveActionModal(null);
                  navigate('/change-requests');
                }}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer hover:underline"
              >
                Open Change Requests & RCA Module →
              </button>
              <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeActionModal === 'contributors' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">👥 Incident Contributors & War-Room</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">✕</button>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              <p className="text-gray-600">Active engineers and commanders in this war-room:</p>
              <div className="divide-y divide-gray-100">
                <div className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{currentAssignee} (Incident Commander)</span>
                  <span className="text-cyan-600 font-bold text-[11px]">Lead</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Admin (You)</span>
                  <span className="text-emerald-600 font-bold text-[11px]">Active</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Infrastructure On-Call</span>
                  <span className="text-gray-500 text-[11px]">Engaged</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionModal(null);
                    navigate('/team/1st-line-live');
                  }}
                  className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer hover:underline"
                >
                  1st Line Queue →
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionModal(null);
                    navigate('/my-work');
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium cursor-pointer hover:underline"
                >
                  My Work Queue →
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast('Invited on-call security team to war-room');
                    setActiveActionModal(null);
                  }}
                  className="px-4 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs cursor-pointer active:scale-95"
                >
                  + Invite On-Call Engineer
                </button>
                <button onClick={() => setActiveActionModal(null)} className="px-5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MajorIncidentConsole;
