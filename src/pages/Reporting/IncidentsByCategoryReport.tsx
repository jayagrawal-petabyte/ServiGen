import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { api } from '../../services/apiClient';
import './IncidentsByCategoryReport.css';

interface FilterTag {
  id: string;
  label: string;
}

interface FilterRow {
  id: string;
  field: string;
  operator: string;
  tags?: FilterTag[];
}

interface ReportTicketRow {
  category: string;
  id: string;
  summary: string;
  createdAt: string;
  site: string;
  team: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  agent: string;
  status: string;
  slaResolutionMet: number;
}

export default function IncidentsByCategoryReport() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dateField, setDateField] = useState('Date Created');
  const [period, setPeriod] = useState('All');
  const [isFavorite, setIsFavorite] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeCategoryTag, setActiveCategoryTag] = useState<string | null>(
    (location.state as any)?.category || 'Network>VPN>Connection Failure'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ReportTicketRow | null>(null);
  const [tickets, setTickets] = useState<ReportTicketRow[]>([]);
  const [showTodoPopover, setShowTodoPopover] = useState(false);
  const [showKpiDashboard, setShowKpiDashboard] = useState(false);
  const [showFeedPopover, setShowFeedPopover] = useState(false);
  const [showTimesheetPopover, setShowTimesheetPopover] = useState(false);
  const [todoDate, setTodoDate] = useState('17/09/2026');
  const [todoItems, setTodoItems] = useState<Array<{ id: string; text: string; done: boolean }>>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function loadIncidents() {
      setIsRefreshing(true);
      try {
        const queryParams: Record<string, string | number> = { limit: 100 };
        if (activeCategoryTag) {
          const primaryCat = activeCategoryTag.includes('>')
            ? activeCategoryTag.split('>')[0].trim()
            : activeCategoryTag.trim();
          if (primaryCat) {
            queryParams.category = primaryCat;
          }
        }
        const res: any = await api.get('/api/incidents', { params: queryParams });
        const list = res?.data?.incidents || (Array.isArray(res?.data) ? res.data : []);
        if (mounted && Array.isArray(list) && list.length > 0) {
          const mapped: ReportTicketRow[] = list.map((item: any) => ({
            id: item.id || '',
            summary: item.summary || 'Incident ticket',
            category: item.incident?.category || item.category || 'General Support',
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '',
            site: item.siteName || item.organisation || 'EMEA',
            team: item.assignedTeam || '1st Line Support',
            priority: (item.priority || 'Medium') as any,
            agent: item.assignedAgent
              ? `${item.assignedAgent.firstName || ''} ${item.assignedAgent.lastName || ''}`.trim() || 'Unassigned'
              : item.agent || 'Unassigned',
            status: item.status || 'Active',
            slaResolutionMet: typeof item.slaTimeLeft === 'number' && item.slaTimeLeft > 0 ? 1 : 0,
          }));
          setTickets(mapped);
        } else if (mounted) {
          setTickets([]);
        }
      } catch (err) {
        console.warn('Failed to load live incidents for report:', err);
        if (mounted) setTickets([]);
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    }
    void loadIncidents();
    return () => {
      mounted = false;
    };
  }, [activeCategoryTag]);

  // Filter rows matching Image 2 exactly
  const [filters, setFilters] = useState<FilterRow[]>([
    {
      id: 'f1',
      field: 'Category',
      operator: 'Is not blank',
    },
    {
      id: 'f2',
      field: 'Category',
      operator: 'Does not include',
      tags: [
        { id: 'c1', label: 'Standard Applications>Email' },
        { id: 'c2', label: 'Standard Applications>Internet' },
        { id: 'c3', label: 'Standard Applications>Other (Not Listed)' },
        { id: 'c4', label: 'Hardware>Laptop' },
        { id: 'c5', label: 'Hardware>Printer' },
        { id: 'c6', label: 'Account Administration' },
        { id: 'c7', label: 'Account Administration>Application Access' },
      ],
    },
    {
      id: 'f3',
      field: 'ITIL Type',
      operator: 'Includes',
      tags: [{ id: 't1', label: 'Incident' }],
    },
    {
      id: 'f4',
      field: 'Team',
      operator: 'Includes',
      tags: [
        { id: 'tm1', label: '1st Line Support' },
        { id: 'tm2', label: '2nd Line Support' },
      ],
    },
  ]);

  const handleCloseTab = () => {
    // Navigate back to previous page or dashboard
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleRemoveTag = (rowId: string, tagId: string) => {
    setFilters((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, tags: row.tags?.filter((t) => t.id !== tagId) }
          : row
      )
    );
  };

  const handleClearTags = (rowId: string) => {
    setFilters((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, tags: [] } : row))
    );
  };

  const handleRemoveFilterRow = (rowId: string) => {
    setFilters((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleAddFilterRow = () => {
    const newId = `f-${Date.now()}`;
    setFilters((prev) => [
      ...prev,
      {
        id: newId,
        field: 'Category',
        operator: 'Includes',
        tags: [{ id: `tag-${Date.now()}`, label: 'Network>VPN' }],
      },
    ]);
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Count', 'Percentage', 'Status'];
    const rows = [
      ['Network>VPN>Connection Failure', '28', '25.9%', 'Active'],
      ['Business Applications>CRM', '12', '11.1%', 'Active'],
      ['Hardware>Desktop>Boot Failure', '11', '10.2%', 'Active'],
      ['Office Applications>Microsoft Teams>Audio/Video Quality', '11', '10.2%', 'Active'],
      ['Outlook>Email Sending/Receiving', '11', '10.2%', 'Active'],
      ['Monitor>Display Issues', '9', '8.3%', 'Active'],
      ['Wi-Fi>Connectivity', '8', '7.4%', 'Active'],
      ['OneDrive>Sync Issues', '8', '7.4%', 'Active'],
      ['Security>Phishing>Email Report', '8', '7.4%', 'Active'],
      ['Security>Multi-Factor Authentication>Token Lost', '7', '6.5%', 'Active'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(item => `"${item}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'incidents_by_category_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatusMessage('Exported to incidents_by_category_report.csv');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setStatusMessage(isFavorite ? 'Removed from My Reports' : 'Added to My Reports ⭐');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className="reporting-page-container">
      {/* Toast banner */}
      {statusMessage && (
        <div className="reporting-toast-banner">
          ✓ {statusMessage}
        </div>
      )}

      {/* ── Top Browser Navigation Bar (matching Image 2) ── */}
      <div className="reporting-top-nav-bar">
        <div className="reporting-tabs-group">
          <div className="reporting-active-tab">
            <span className="tab-title">Reporting</span>
            <button
              type="button"
              className="tab-close-btn"
              onClick={handleCloseTab}
              title="Close Reporting Tab"
            >
              ✕
            </button>
          </div>
          <button
            type="button"
            className="reporting-new-tab-btn"
            title="Open New Tab"
            onClick={() => {
              setStatusMessage('New report workspace opened');
              setTimeout(() => setStatusMessage(null), 2000);
            }}
          >
            +
          </button>
        </div>

        {/* Right utility items from Image 2 */}
        <div className="reporting-top-right-tools">
          <GlobalNavbarActions
            onGetStarted={() => navigate('/dashboard')}
            onNewTicket={() => navigate('/incidents')}
            onOpenTicket={(id) => {
              const found = tickets.find((t) => t.id === id);
              if (found) setSelectedTicket(found);
            }}
          />
        </div>
      </div>



      {/* ── Main Reporting Canvas (Image 2) ── */}
      <div className="reporting-main-canvas">
        {/* Top actions: Export to CSV & Add to My Reports */}
        <div className="report-action-toolbar">
          <button
            type="button"
            className="report-pill-btn"
            onClick={handleExportCSV}
            title="Download report data as CSV file"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span>Export to CSV</span>
          </button>

          <button
            type="button"
            className={`report-pill-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={handleToggleFavorite}
            title="Save to personalized My Reports list"
          >
            <span className="text-sm">{isFavorite ? '★' : '☆'}</span>
            <span>Add to My Reports</span>
          </button>
        </div>

        {/* Page Title */}
        <h1 className="report-page-heading">Incidents by Category</h1>

        {/* ── Section 1: Reporting Period ── */}
        <div className="report-section-block">
          <div className="report-section-header-pill">
            <span>Reporting Period</span>
          </div>

          <div className="report-period-row">
            <div className="report-select-wrapper">
              <select
                className="report-select-input"
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
              >
                <option value="Date Created">Date Created</option>
                <option value="Date Resolved">Date Resolved</option>
                <option value="Date Closed">Date Closed</option>
                <option value="Date Updated">Date Updated</option>
              </select>
            </div>

            <div className="report-select-wrapper">
              <select
                className="report-select-input"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Quarter">This Quarter</option>
                <option value="This Year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 2: Filters ── */}
        <div className="report-section-block filters-block">
          <div className="report-section-header-pill filters-header-pill">
            <span>Filters</span>
            <button
              type="button"
              className="filter-add-plus-btn"
              onClick={handleAddFilterRow}
              title="Add another filter condition"
            >
              ⊕
            </button>
          </div>

          <div className="filter-rows-container">
            {filters.map((filter) => (
              <div key={filter.id} className="filter-item-row">
                {/* Field select (e.g. Category, ITIL Type, Team) */}
                <div className="filter-select-field">
                  <select
                    className="report-select-input"
                    value={filter.field}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters((prev) =>
                        prev.map((r) => (r.id === filter.id ? { ...r, field: val } : r))
                      );
                    }}
                  >
                    <option value="Category">Category</option>
                    <option value="ITIL Type">ITIL Type</option>
                    <option value="Team">Team</option>
                    <option value="Priority">Priority</option>
                    <option value="Status">Status</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>

                {/* Operator select (e.g. Is not blank, Does not include, Includes) */}
                <div className="filter-select-operator">
                  <select
                    className="report-select-input"
                    value={filter.operator}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters((prev) =>
                        prev.map((r) => (r.id === filter.id ? { ...r, operator: val } : r))
                      );
                    }}
                  >
                    <option value="Is not blank">Is not blank</option>
                    <option value="Does not include">Does not include</option>
                    <option value="Includes">Includes</option>
                    <option value="Equals">Equals</option>
                    <option value="Is blank">Is blank</option>
                  </select>
                </div>

                {/* Tag values box (if applicable) */}
                {filter.tags && (
                  <div className="filter-tags-box">
                    <div className="tags-chips-list">
                      {filter.tags.map((tag) => (
                        <span key={tag.id} className="filter-cyan-tag">
                          <span>{tag.label}</span>
                          <button
                            type="button"
                            className="tag-remove-x"
                            onClick={() => handleRemoveTag(filter.id, tag.id)}
                            title={`Remove ${tag.label}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="tags-box-controls">
                      {filter.tags.length > 0 && (
                        <button
                          type="button"
                          className="tags-clear-all"
                          onClick={() => handleClearTags(filter.id)}
                          title="Clear all selected"
                        >
                          ✕
                        </button>
                      )}
                      <span className="tags-caret">▾</span>
                    </div>
                  </div>
                )}

                {/* Remove filter row button on far right */}
                <button
                  type="button"
                  className="filter-remove-row-btn"
                  onClick={() => handleRemoveFilterRow(filter.id)}
                  title="Remove this filter"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Filter Tag (Matching Image 1) ── */}
        {activeCategoryTag && (
          <div className="report-active-filter-row">
            <span className="report-filter-tag-pill">
              <span>Category = "{activeCategoryTag}"</span>
              <button
                type="button"
                className="report-tag-close-btn"
                onClick={() => setActiveCategoryTag(null)}
                title="Remove Category Filter"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {/* ── Refresh Report & Results Counter (Matching Image 1) ── */}
        <div className="report-table-action-bar">
          <button
            type="button"
            className="report-refresh-btn"
            onClick={() => {
              setIsRefreshing(true);
              setStatusMessage('Refreshed report data with latest metrics');
              setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => setStatusMessage(null), 2000);
              }, 600);
            }}
            title="Refresh current report query"
          >
            <span className={`text-sm ${isRefreshing ? 'animate-spin inline-block' : ''}`}>🔄</span>
            <span>Refresh Report</span>
          </button>

          <span className="report-results-count">Results: {tickets.length}</span>
        </div>

        {/* ── Data Table (Matching Image 1 & Image 2) ── */}
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th className="sortable-th" title="Click to sort by Category">
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    <span className="text-[10px]">▲</span>
                  </div>
                </th>
                <th>Ticket ID</th>
                <th>Summary</th>
                <th>Date Created</th>
                <th>Site</th>
                <th>Team</th>
                <th>Priority</th>
                <th>Assigned Agent</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>SLA Resolution Met</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, idx) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  title={`View ticket #${t.id} details`}
                >
                  <td>{idx === 0 ? t.category : ''}</td>
                  <td>
                    <button
                      type="button"
                      className="report-ticket-id-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(t);
                      }}
                    >
                      {t.id}
                    </button>
                  </td>
                  <td className="report-summary-cell">{t.summary}</td>
                  <td className="whitespace-nowrap">{t.createdAt}</td>
                  <td>{t.site}</td>
                  <td className="whitespace-nowrap">{t.team}</td>
                  <td>
                    <span className={`report-priority-badge priority-${t.priority.toLowerCase()}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{t.agent}</td>
                  <td>
                    <span className="report-status-badge">{t.status}</span>
                  </td>
                  <td className="report-sla-met-cell">{t.slaResolutionMet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Ticket Detail Modal Popup ── */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={{
            id: selectedTicket.id,
            type: 'Incident',
            summary: selectedTicket.summary,
            category: selectedTicket.category,
            priority: selectedTicket.priority,
            agent: selectedTicket.agent,
            status: selectedTicket.status,
            site: selectedTicket.site,
            createdAt: selectedTicket.createdAt,
          }}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* ── Bottom Right Assistant Help Bubble ── */}
      <div className="reporting-floating-assistant" title="ITSM Reporting Assistant">
        <div className="assistant-circle-cyan">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div className="assistant-circle-navy">
          <span className="text-sm">✦</span>
        </div>
      </div>
    </div>
  );
}
