import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AgentKpiDrawer.css';

interface AgentKpiDrawerProps {
  onClose: () => void;
  onOpenTicket?: (ticketId: string) => void;
}

export const AgentKpiDrawer: React.FC<AgentKpiDrawerProps> = ({ onClose, onOpenTicket }) => {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState('Demo User');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate real ML/KPI metrics fetch with authentic spinner
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [selectedAgent]);

  const handleTicketClick = (ticketId: string) => {
    if (onOpenTicket) {
      onOpenTicket(ticketId);
    } else {
      onClose();
      navigate(`/major-incidents/live?incident=${ticketId}`);
    }
  };

  return (
    <aside className="agent-kpi-drawer-floating" aria-label="Agent KPI Dashboard">
      {/* Header matching Image 2 (media_1792151243234_fe133929.png) */}
      <div className="agent-kpi-header">
        <h2 className="agent-kpi-title">Agent KPI Dashboard</h2>
        <button
          type="button"
          className="agent-kpi-close-btn"
          onClick={onClose}
          title="Close Agent KPI Dashboard"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="agent-kpi-content-scroll">
        {/* Agent Filter Selector matching Image 2 */}
        <div className="agent-kpi-agent-section">
          <label className="agent-kpi-label">Agent</label>
          <div className="agent-kpi-select-row">
            <div className="agent-kpi-pill">
              <span>{selectedAgent}</span>
              <button
                type="button"
                className="agent-kpi-pill-remove"
                onClick={() => setSelectedAgent('All Agents')}
                title="Clear agent filter"
              >
                ✕
              </button>
            </div>
            <div className="agent-kpi-dots-indicator" title="Switch agent page">
              <span className="dot-active" />
              <span className="dot-inactive" />
              <span className="dot-inactive" />
            </div>
            <button
              type="button"
              className="agent-kpi-caret-btn"
              title="Change agent"
              onClick={() => {
                const agents = ['Demo User', 'Jennifer Williams', 'James Brown', 'All Agents'];
                const nextIdx = (agents.indexOf(selectedAgent) + 1) % agents.length;
                setSelectedAgent(agents[nextIdx]);
                setIsLoading(true);
              }}
            >
              ▾
            </button>
          </div>
        </div>

        {/* Card 1: Predicted Backlog matching Image 2 */}
        <div className="agent-kpi-card">
          <div className="agent-kpi-card-header">
            <h3 className="agent-kpi-card-title">Predicted Backlog</h3>
            <span className="agent-kpi-confidence-badge">AI Forecast</span>
          </div>

          <div className="agent-kpi-card-body">
            {isLoading ? (
              <div className="agent-kpi-loading-box">
                <div className="agent-kpi-circular-spinner" />
                <span className="agent-kpi-loading-text">Forecasting ticket volume…</span>
              </div>
            ) : (
              <div className="agent-kpi-metrics-inner">
                <div className="agent-kpi-big-stat">
                  <span className="stat-number">4</span>
                  <div className="stat-meta">
                    <span className="stat-label">Tickets Expected Today</span>
                    <span className="stat-trend text-emerald-600 font-semibold">▲ +12% vs 7-day avg</span>
                  </div>
                </div>

                <div className="agent-kpi-bars-preview">
                  <div className="bar-col">
                    <div className="bar-track"><div className="bar-fill" style={{ height: '35%' }} /></div>
                    <span className="bar-label">10 AM</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-track"><div className="bar-fill" style={{ height: '60%' }} /></div>
                    <span className="bar-label">12 PM</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-track"><div className="bar-fill bar-peak" style={{ height: '95%' }} /></div>
                    <span className="bar-label font-bold text-cyan-600">02 PM</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-track"><div className="bar-fill" style={{ height: '70%' }} /></div>
                    <span className="bar-label">04 PM</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-track"><div className="bar-fill" style={{ height: '40%' }} /></div>
                    <span className="bar-label">06 PM</span>
                  </div>
                </div>

                <div className="agent-kpi-footer-note">
                  Peak influx expected at <strong>02:00 PM – 04:30 PM</strong>. Team capacity remains <strong>94% optimal</strong>.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Average Response and Fix Time matching Image 2 */}
        <div className="agent-kpi-card">
          <div className="agent-kpi-card-header">
            <h3 className="agent-kpi-card-title">Average Response and Fix Time</h3>
            <span className="agent-kpi-sla-badge">Target: 95%</span>
          </div>

          <div className="agent-kpi-card-body">
            {isLoading ? (
              <div className="agent-kpi-loading-box">
                <div className="agent-kpi-circular-spinner" />
                <span className="agent-kpi-loading-text">Computing SLA response matrix…</span>
              </div>
            ) : (
              <div className="agent-kpi-metrics-inner">
                <div className="agent-kpi-split-stats">
                  <div className="split-stat-item">
                    <span className="split-label">Avg First Response</span>
                    <span className="split-val text-emerald-600">14m 20s</span>
                    <span className="split-sub">Target &lt; 30m (98.2% met)</span>
                  </div>
                  <div className="split-stat-item">
                    <span className="split-label">Avg Resolution Time</span>
                    <span className="split-val text-indigo-600">2h 18m</span>
                    <span className="split-sub">Target &lt; 4h (91.4% met)</span>
                  </div>
                </div>

                <div className="agent-kpi-progress-wrapper">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-700 mb-1">
                    <span>Overall SLA Compliance</span>
                    <span className="text-emerald-600 font-bold">96.8%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2.5 rounded-full" style={{ width: '96.8%' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Unassigned Tickets matching Image 2 */}
        <div className="agent-kpi-card">
          <div className="agent-kpi-card-header">
            <h3 className="agent-kpi-card-title">Unassigned Tickets</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              3 Pending
            </span>
          </div>
          <div className="agent-kpi-card-body p-2">
            <div className="space-y-1.5">
              <div
                onClick={() => handleTicketClick('0003995')}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-cyan-50 border border-gray-100 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-bold text-gray-800 text-xs">#0003995 • Emails not Sending</div>
                  <div className="text-[10px] text-gray-500">Demo User • consultancy/EMEA</div>
                </div>
                <span className="text-[10px] font-bold text-cyan-600 hover:underline">Claim →</span>
              </div>
              <div
                onClick={() => handleTicketClick('0003994')}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-cyan-50 border border-gray-100 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-bold text-gray-800 text-xs">#0003994 • Disk Drive Slowness</div>
                  <div className="text-[10px] text-gray-500">Jennifer Williams • Halo/EMEA</div>
                </div>
                <span className="text-[10px] font-bold text-cyan-600 hover:underline">Claim →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Tickets Breaching SLA matching Image 2 */}
        <div className="agent-kpi-card">
          <div className="agent-kpi-card-header">
            <h3 className="agent-kpi-card-title text-red-600">Tickets Breaching SLA</h3>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
              1 Breached
            </span>
          </div>
          <div className="agent-kpi-card-body p-2">
            <div
              onClick={() => handleTicketClick('0003132')}
              className="flex items-center justify-between p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-bold text-red-800 text-xs">#0003132 • Implementation Review</div>
                <div className="text-[10px] text-red-600 font-semibold">Overdue by -32:01</div>
              </div>
              <span className="text-[10px] font-bold text-red-700 underline">Inspect →</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AgentKpiDrawer;
