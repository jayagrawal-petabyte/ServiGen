import React from 'react';
import type { ArticleDraft } from './articleDrafts.types';
import { SlaBadge } from '../../components/shared/SlaBadge';
import { StatusBadge } from '../../components/shared/StatusBadge';

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
  isLoading?: boolean;
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
  isLoading = false,
}: ArticleDraftsDesignViewProps) {
  const allSelected =
    drafts.length > 0 && drafts.every((d) => selectedIds.includes(d.id));

  return (
    <div className="article-drafts-table-container">
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
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td className="checkbox-col">
                    <div className="draft-skeleton" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '60px', height: '14px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '80px', height: '22px', borderRadius: '12px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '180px', height: '14px', marginBottom: '4px' }} />
                    <div className="draft-skeleton" style={{ width: '120px', height: '12px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '90px', height: '14px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '70px', height: '14px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '60px', height: '20px', borderRadius: '10px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '50px', height: '14px' }} />
                  </td>
                  <td>
                    <div className="draft-skeleton" style={{ width: '70px', height: '14px' }} />
                  </td>
                </tr>
              ))
            ) : drafts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    No article drafts found
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    No draft articles match the current filter or search criteria.
                  </div>
                </td>
              </tr>
            ) : (
              drafts.map((draft) => {
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

                    <td
                      className="id-cell"
                      onClick={() => onOpenArticle(draft)}
                      title="Click to view and edit draft details"
                    >
                      {draft.id}
                    </td>

                    <td className="sla-cell">
                      <SlaBadge slaTimeLeft={draft.slaTimeLeft} />
                    </td>

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

                    <td className="category-cell">{draft.category}</td>

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

                    <td>
                      <StatusBadge status={draft.status} />
                    </td>

                    <td className="type-cell">{draft.type}</td>

                    <td className="date-cell">{draft.date}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
