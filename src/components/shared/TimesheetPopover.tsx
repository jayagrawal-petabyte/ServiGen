import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TimesheetPopover.css';

interface TimesheetPopoverProps {
  onClose: () => void;
  userName?: string;
  userDate?: string;
}

export const TimesheetPopover: React.FC<TimesheetPopoverProps> = ({
  onClose,
  userName = 'Demo User',
  userDate = '17/09/2026',
}) => {
  const navigate = useNavigate();
  const [startTime, setStartTime] = useState('--:--');
  const [finishTime, setFinishTime] = useState('--:--');
  const [loggedHours, setLoggedHours] = useState<number>(0);
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

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
    setTimeout(() => setStatusNotice(null), 2500);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // Time grid slots from 12:00 AM to 11:50 PM
  const timeSlots = [
    '12:00 AM',
    '12:10 AM',
    '12:20 AM',
    '12:30 AM',
    '12:40 AM',
    '12:50 AM',
    '01:00 AM',
    '01:10 AM',
    '01:20 AM',
    '01:30 AM',
    '01:40 AM',
    '01:50 AM',
    '02:00 AM',
    '02:10 AM',
    '02:20 AM',
    '02:30 AM',
    '02:40 AM',
    '02:50 AM',
    '03:00 AM',
    '03:10 AM',
    '03:20 AM',
    '03:30 AM',
    '03:40 AM',
    '03:50 AM',
    '04:00 AM',
    '04:10 AM',
    '04:20 AM',
    '04:30 AM',
    '04:40 AM',
    '04:50 AM',
    '05:00 AM',
    '05:10 AM',
    '05:20 AM',
    '05:30 AM',
    '05:40 AM',
    '05:50 AM',
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
            {userName} - {userDate}
          </span>
        </div>

        {/* Inputs & Stats Grid */}
        <div className="timesheet-metrics-grid">
          {/* Start Time */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Start Time:</span>
            <div className="timesheet-input-box">
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
                onClick={() => setStartTime('09:00 AM')}
                title="Pick start time"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Finish Time */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Finish Time:</span>
            <div className="timesheet-input-box">
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
                onClick={() => setFinishTime('05:00 PM')}
                title="Pick finish time"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Target Hours */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Target Hours:</span>
            <span className="timesheet-metric-val font-semibold">08:00</span>
          </div>

          {/* Hours Worked */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Hours Worked:</span>
            <span className="timesheet-metric-val text-gray-400">-</span>
          </div>

          {/* Hours Logged */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Hours Logged:</span>
            <div className="flex items-center gap-2">
              <span className={`timesheet-metric-val ${loggedHours > 0 ? 'font-semibold text-cyan-600' : 'text-gray-400'}`}>
                {loggedHours > 0 ? `${String(loggedHours).padStart(2, '0')}:00` : '-'}
              </span>
              <button
                type="button"
                className="timesheet-plus-circle cursor-pointer hover:bg-cyan-500 hover:text-white transition-colors"
                title="Add logged hours (+1 hr)"
                onClick={() => {
                  setLoggedHours((h) => Math.min(12, h + 1));
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
              <span className={`timesheet-metric-val ${breakMinutes > 0 ? 'font-semibold text-amber-600' : 'text-gray-400'}`}>
                {breakMinutes > 0 ? `${breakMinutes} min` : '-'}
              </span>
              <button
                type="button"
                className="timesheet-plus-circle cursor-pointer hover:bg-amber-500 hover:text-white transition-colors"
                title="Add break time (+15 min)"
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

          {/* Unlogged Time */}
          <div className="timesheet-metric-row">
            <span className="timesheet-metric-label">Unlogged Time:</span>
            <div className="flex items-center gap-2">
              <span className="timesheet-metric-val font-semibold">08:00</span>
              <button
                type="button"
                className="timesheet-plus-circle cursor-pointer hover:bg-cyan-500 hover:text-white transition-colors"
                title="Log remaining unlogged time"
                onClick={() => {
                  setLoggedHours(8);
                  showNotice('All 8 target hours logged');
                }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Action Links */}
        {/* Timer notification / Active Timer badge */}
        {timerActive && (
          <div className="flex items-center justify-between mx-4 mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Active Timer:</span>
              <span className="font-mono text-emerald-900 font-bold">{formatTimer(timerSeconds)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTimerActive(false);
                showNotice(`Timer recorded: ${formatTimer(timerSeconds)}`);
              }}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium underline cursor-pointer"
            >
              Stop &amp; Log
            </button>
          </div>
        )}

        {statusNotice && (
          <div className="mx-4 mb-2 p-1.5 bg-cyan-50 border border-cyan-200 rounded text-[11px] text-cyan-800 text-center font-medium">
            {statusNotice}
          </div>
        )}

        {/* Action Links */}
        <div className="timesheet-links-row">
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
            className="timesheet-action-link cursor-pointer bg-transparent border-none text-left font-semibold text-cyan-600"
            onClick={() => {
              setTimerActive((prev) => !prev);
              showNotice(!timerActive ? 'Active timer started' : 'Timer stopped');
            }}
          >
            {timerActive ? 'Pause current timer' : 'Start a new timer ▶'}
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
