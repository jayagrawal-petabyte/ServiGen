import React from 'react';
import type { ArticleDraft } from './mockArticleDraftsData';

interface ArticleDraftsDesignViewProps {
  drafts: ArticleDraft[];
  totalDrafts: number;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenArticle: (draft: ArticleDraft) => void;
  sortDirection: 'asc' | 'desc';
  onToggleSort: () => void;
}

export default function ArticleDraftsDesignView({
  drafts,
  totalDrafts,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenArticle,
  sortDirection,
  onToggleSort,
}: ArticleDraftsDesignViewProps) {
  const allSelected =
    drafts.length > 0 && drafts.every((d) => selectedIds.includes(d.id));

  const startIndex = totalDrafts === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIndex = Math.min(currentPage * perPage, totalDrafts);

  return (
    <div className="article-drafts-table-container">
      {/* Table Toolbar matching UI/UX screenshot */}
      <div className="drafts-table-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-count">
            Showing <strong>{startIndex} - {endIndex}</strong> of{' '}
            <strong>{totalDrafts}</strong> article drafts
          </span>

          <div className="per-page-selector">
            <span>Per page:</span>
            <select
              className="per-page-dropdown"
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
            onClick={() => onPageChange(1)}
          >
            1
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 2 ? 'active' : ''}`}
            onClick={() => onPageChange(2)}
          >
            2
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 3 ? 'active' : ''}`}
            onClick={() => onPageChange(3)}
          >
            3
          </button>

          <span className="pagination-ellipsis">...</span>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 5 ? 'active' : ''}`}
            onClick={() => onPageChange(5)}
          >
            5
          </button>

          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === totalPages || totalPages <= 1}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="drafts-table-wrapper">
        <table className="drafts-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all drafts"
                />
              </th>

              <th className="sortable-th" onClick={onToggleSort}>
                <div className="th-sort-wrapper">
                  <span>ID</span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {sortDirection === 'asc' ? (
                      <polyline points="18 15 12 9 6 15" />
                    ) : (
                      <polyline points="6 9 12 15 18 9" />
                    )}
                  </svg>
                </div>
              </th>

              <th>SLA TIME LEFT</th>
              <th>SUMMARY</th>
              <th>CATEGORY</th>
              <th>PRIORITY</th>
              <th>STATUS</th>
              <th>TYPE</th>
              <th>DATE</th>
            </tr>
          </thead>

          <tbody>
            {drafts.map((draft) => {
              const isSelected = selectedIds.includes(draft.id);

              return (
                <tr
                  key={draft.id}
                  className={isSelected ? 'selected-row' : ''}
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(draft.id)}
                      aria-label={`Select draft ${draft.id}`}
                    />
                  </td>

                  {/* ID Cell */}
                  <td
                    className="id-cell"
                    onClick={() => onOpenArticle(draft)}
                    title="Click to view and edit draft details"
                  >
                    {draft.id}
                  </td>

                  {/* SLA TIME LEFT Cell */}
                  <td className="sla-cell">
                    {draft.slaStatus === 'overdue' ? (
                      <span className="sla-pill overdue">
                        <span className="sla-dot overdue" />
                        <span>Overdue SLA</span>
                      </span>
                    ) : (
                      <span className={`sla-pill ${draft.slaStatus}`}>
                        <span className={`sla-dot ${draft.slaStatus}`} />
                        <span>{draft.slaTimeLeft}</span>
                      </span>
                    )}
                  </td>

                  {/* SUMMARY Cell */}
                  <td className="summary-cell">
                    <div
                      className="summary-title"
                      onClick={() => onOpenArticle(draft)}
                      title="Click to view/edit"
                    >
                      {draft.summaryTitle}
                    </div>
                    {draft.summarySubtitle && (
                      <div className="summary-subtitle">
                        {draft.summarySubtitle}
                      </div>
                    )}
                  </td>

                  {/* CATEGORY Cell */}
                  <td className="category-cell">{draft.category}</td>

                  {/* PRIORITY Cell */}
                  <td>
                    <div className="priority-cell">
                      <span
                        className="priority-box"
                        style={{
                          backgroundColor:
                            draft.priorityColor ||
                            (draft.priority === 'High'
                              ? '#c2593f'
                              : draft.priority === 'Medium'
                              ? '#e07a5f'
                              : '#ca8a04'),
                        }}
                      />
                      <span>{draft.priority}</span>
                    </div>
                  </td>

                  {/* STATUS Cell */}
                  <td>
                    <span
                      className={`status-pill ${
                        draft.status === 'Awaiting Approval'
                          ? 'awaiting'
                          : draft.status.toLowerCase()
                      }`}
                    >
                      {draft.status}
                    </span>
                  </td>

                  {/* TYPE Cell */}
                  <td className="type-cell">{draft.type}</td>

                  {/* DATE Cell */}
                  <td className="date-cell">{draft.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}