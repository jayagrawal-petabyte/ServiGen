import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import './TimesheetPopover.css';

interface TimesheetPopoverProps {
  onClose: () => void;
  userName?: string;
  userDate?: string;
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || timeStr === '--:--') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function formatMinutesToHours(minutes: number): string {
  const safeMin = Math.max(0, minutes);
  const h = Math.floor(safeMin / 60);
  const m = safeMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const TimesheetPopover: React.FC<TimesheetPopoverProps> = ({
  onClose,
  userName,
  userDate,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const effectiveUserName = userName || user?.fullName || '';
  const effectiveDate = userDate || new Date().toLocaleDateString('en-GB');

  // Load persistent state or fall back to defaults
  const [startTime, setStartTime] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('servigen_timesheet_data');
      return saved ? JSON.parse(saved).startTime || '09:00 AM' : '09:00 AM';
    } catch {
      return '09:00 AM';
    }
  });

  const [finishTime, setFinishTime] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('servigen_timesheet_data');
      return saved ? JSON.parse(saved).finishTime || '05:00 PM' : '05:00 PM';
    } catch {
      return '05:00 PM';
    }
  });

  const [loggedMinutes, setLoggedMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('servigen_timesheet_data');
      return saved ? JSON.parse(saved).loggedMinutes ?? 60 : 60;
    } catch {
      return 60;
    }
  });

  const [breakMinutes, setBreakMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('servigen_timesheet_data');
      return saved ? JSON.parse(saved).breakMinutes ?? 15 : 15;
    } catch {
      return 15;
    }
  });

  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isFinishMenuOpen, setIsFinishMenuOpen] = useState(false);

  const startMenuRef = useRef<HTMLDivElement>(null);
  const finishMenuRef = useRef<HTMLDivElement>(null);

  // Persist state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        'servigen_timesheet_data',
        JSON.stringify({
          startTime,
          finishTime,
          loggedMinutes,
          breakMinutes,
        })
      );
    } catch {}
  }, [startTime, finishTime, loggedMinutes, breakMinutes]);

  // Handle outside click for menus
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (startMenuRef.current && !startMenuRef.current.contains(e.target as Node)) {
        setIsStartMenuOpen(false);
      }
      if (finishMenuRef.current && !finishMenuRef.current.contains(e.target as Node)) {
        setIsFinishMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // Target hours: 8 hours = 480 minutes
  const TARGET_MINUTES = 480;

  // Calculate Hours Worked = (Finish Time - Start Time) - Break Time
  const hoursWorkedStr = useMemo(() => {
    const startMins = parseTimeToMinutes(startTime);
    const finishMins = parseTimeToMinutes(finishTime);

    if (startMins === null || finishMins === null) return '-';

    let diff = finishMins - startMins;
    if (diff < 0) diff += 24 * 60; // Crosses midnight

    const workedMins = Math.max(0, diff - breakMinutes);
    return formatMinutesToHours(workedMins);
  }, [startTime, finishTime, breakMinutes]);

  // Calculate Unlogged Time = Target Hours - Logged Hours
  const unloggedMinutes = Math.max(0, TARGET_MINUTES - loggedMinutes);
  const unloggedStr = formatMinutesToHours(unloggedMinutes);
  const loggedStr = formatMinutesToHours(loggedMinutes);

  const START_SUGGESTIONS = ['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM'];
  const FINISH_SUGGESTIONS = ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'];

  // Time grid slots
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  return (
    <div className="timesheet-floating-popover">
      {/* Header */}
      <div className="timesheet-popover-header">
        <h3 className="timesheet-popover-title">Timesheet</h3>
        <button
          type="button"
          className="timesheet-popover-close-btn"
          onClick={onClose}
          title="Close Timesheet"
        >
          ✕
        </button>
      </div>

      {/* Main Info Card */}
      <div className="timesheet-info-card">
        {/* User Header */}
        <div className="timesheet-user-row">
          <div className="timesheet-icon-circle">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 10" />
            </svg>
          </div>
          <span className="timesheet-user-name">
            {effectiveUserName} - {effectiveDate}
          </span>
        </div>

        {/* Inputs & Stats Grid */}
        <div className="timesheet-metrics-grid">
          {/* Start Time */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Start Time:</span>
            <div className="timesheet-input-box" ref={startMenuRef}>
              <input
                type="text"
                className="timesheet-time-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="--:--"
              />
              <button
                type="button"
                className="timesheet-clock-btn"
                onClick={() => setIsStartMenuOpen((o) => !o)}
                title="Select start time"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>

              {isStartMenuOpen && (
                <div className="timesheet-dropdown-menu">
                  {START_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="timesheet-dropdown-item"
                      onClick={() => {
                        setStartTime(t);
                        setIsStartMenuOpen(false);
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Finish Time */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Finish Time:</span>
            <div className="timesheet-input-box" ref={finishMenuRef}>
              <input
                type="text"
                className="timesheet-time-input"
                value={finishTime}
                onChange={(e) => setFinishTime(e.target.value)}
                placeholder="--:--"
              />
              <button
                type="button"
                className="timesheet-clock-btn"
                onClick={() => setIsFinishMenuOpen((o) => !o)}
                title="Select finish time"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>

              {isFinishMenuOpen && (
                <div className="timesheet-dropdown-menu">
                  {FINISH_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="timesheet-dropdown-item"
                      onClick={() => {
                        setFinishTime(t);
                        setIsFinishMenuOpen(false);
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Target Hours */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Target Hours:</span>
            <span className="timesheet-metric-val font-semibold">08:00</span>
          </div>

          {/* Hours Worked (Dynamically Computed) */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Hours Worked:</span>
            <span className="timesheet-metric-val font-semibold text-gray-800">
              {hoursWorkedStr}
            </span>
          </div>

          {/* Hours Logged */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Hours Logged:</span>
            <div className="flex items-center gap-2">
              <span className={`timesheet-metric-val font-bold text-cyan-600`}>
                {loggedStr}
              </span>
              <button
                type="button"
                className="timesheet-plus-circle cursor-pointer hover:bg-cyan-500 hover:text-white transition-colors"
                title="Add 1 hour to logged time"
                onClick={() => {
                  setLoggedMinutes((m) => Math.min(TARGET_MINUTES + 120, m + 60));
                  showNotice('Logged +1 hr');
                }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Break Time */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Break Time:</span>
            <div className="flex items-center gap-2">
              <span className="timesheet-metric-val font-semibold text-amber-600">
                {breakMinutes} min
              </span>
              <button
                type="button"
                className="timesheet-plus-circle cursor-pointer hover:bg-amber-500 hover:text-white transition-colors"
                title="Add 15 min break"
                onClick={() => {
                  setBreakMinutes((m) => m + 15);
                  showNotice('Added +15 min break');
                }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Unlogged Time (Dynamically Computed) */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Unlogged Time:</span>
            <div className="flex items-center gap-2">
              <span className={`timesheet-metric-val font-bold ${unloggedMinutes > 0 ? 'text-gray-900' : 'text-emerald-600'}`}>
                {unloggedStr}
              </span>
              {unloggedMinutes > 0 && (
                <button
                  type="button"
                  className="timesheet-plus-circle cursor-pointer hover:bg-cyan-500 hover:text-white transition-colors"
                  title="Log remaining unlogged time"
                  onClick={() => {
                    setLoggedMinutes(TARGET_MINUTES);
                    showNotice('Logged all 8 target hours');
                  }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Ticking Timer Card */}
        {timerActive && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Timer Running:</span>
              <span className="font-mono font-bold text-sm text-emerald-800">{formatTimer(timerSeconds)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const addedMinutes = Math.max(1, Math.round(timerSeconds / 60));
                setLoggedMinutes((m) => m + addedMinutes);
                setTimerActive(false);
                setTimerSeconds(0);
                showNotice(`Timer logged: +${addedMinutes} min`);
              }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 rounded px-2 py-0.5"
            >
              Stop &amp; Log
            </button>
          </div>
        )}

        {/* Status Toast Banner */}
        {statusNotice && (
          <div className="mt-3 p-2 bg-cyan-50 border border-cyan-200 rounded-lg text-xs text-cyan-800 text-center font-semibold">
            {statusNotice}
          </div>
        )}

        {/* Action Links */}
        <div className="timesheet-links-row mt-3">
          <button
            type="button"
            className="timesheet-action-link cursor-pointer bg-transparent border-none text-left"
            onClick={() => {
              onClose();
              navigate('/calendar');
            }}
          >
            View more Timesheets →
          </button>
          <button
            type="button"
            className={`timesheet-action-link cursor-pointer bg-transparent border-none text-left font-semibold ${
              timerActive ? 'text-amber-600' : 'text-cyan-600'
            }`}
            onClick={() => {
              setTimerActive((prev) => !prev);
              showNotice(!timerActive ? 'Active timer started ▶' : 'Timer paused');
            }}
          >
            {timerActive ? 'Pause current timer ⏸' : 'Start a new timer ▶'}
          </button>
        </div>
      </div>

      {/* Timeline Schedule Grid */}
      <div className="timesheet-timeline-grid-wrap">
        <div className="timesheet-timeline-grid">
          {timeSlots.map((slot) => (
            <div key={slot} className="timesheet-grid-row">
              <div className="timesheet-grid-time">{slot}</div>
              <div className="timesheet-grid-cell" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimesheetPopover;
