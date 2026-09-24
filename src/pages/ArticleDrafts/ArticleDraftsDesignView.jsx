import React from 'react';

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
  onToggleSort
}) {
  const allSelected = drafts.length > 0 && drafts.every((d) => selectedIds.includes(d.id));

  const startIndex = totalDrafts === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIndex = Math.min(currentPage * perPage, totalDrafts);

  return (
    <div>
      {/* Table Toolbar */}
      <div className="drafts-table-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-count">
            Showing <strong>{startIndex} - {endIndex}</strong> of <strong>{totalDrafts}</strong> article drafts
          </span>

          <div className="per-page-selector">
            <span>Per page:</span>
            <select
              className="per-page-dropdown"
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Pagination buttons */}
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          {totalPages > 4 && currentPage < totalPages - 2 && (
            <>
              <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
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
              <th className="sortable" onClick={onToggleSort}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>ID</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                <tr key={draft.id} className={isSelected ? 'selected-row' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(draft.id)}
                      aria-label={`Select draft ${draft.id}`}
                    />
                  </td>

                  {/* ID */}
                  <td className="id-cell" onClick={() => onOpenArticle(draft)}>
                    {draft.id}
                  </td>

                  {/* SLA Time Left */}
                  <td className="sla-cell">
                    {draft.slaStatus === 'overdue' ? (
                      <span className="sla-pill-overdue">Overdue SLA</span>
                    ) : (
                      <span className="sla-dot-text">
                        <span className={`sla-dot ${draft.slaStatus}`} />
                        <span>{draft.slaTimeLeft}</span>
                      </span>
                    )}
                  </td>

                  {/* Summary */}
                  <td className="summary-cell">
                    <div
                      className="summary-title"
                      onClick={() => onOpenArticle(draft)}
                    >
                      {draft.summaryTitle}
                    </div>
                    <div className="summary-subtitle">{draft.summarySubtitle}</div>
                  </td>

                  {/* Category */}
                  <td className="category-cell">{draft.category}</td>

                  {/* Priority */}
                  <td>
                    <div className="priority-cell">
                      <span
                        className="priority-box"
                        style={{ backgroundColor: draft.priorityColor || '#a16207' }}
                      />
                      <span>{draft.priority}</span>
                    </div>
                  </td>

                  {/* Status */}
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

                  {/* Type */}
                  <td className="type-cell">{draft.type}</td>

                  {/* Date */}
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
