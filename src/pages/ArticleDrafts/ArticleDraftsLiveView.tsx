import React, { useMemo, useState } from 'react';
import type { ArticleDraft, ArticleDraftStatus } from './articleDrafts.types';
import { SlaBadge } from '../../components/shared/SlaBadge';
import { StatusBadge } from '../../components/shared/StatusBadge';

interface ArticleDraftsLiveViewProps {
  drafts: ArticleDraft[];
  onOpenArticle: (article: ArticleDraft) => void;
  onUpdateStatus?: (id: string, newStatus: ArticleDraftStatus) => void;
}

function getInitials(name?: string): string {
  if (!name) return 'UN';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ArticleDraftsLiveView({
  drafts,
  onOpenArticle,
}: ArticleDraftsLiveViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = useMemo(() => {
    const list = Array.from(new Set(drafts.map((d) => d.category).filter(Boolean)));
    return ['All', ...list];
  }, [drafts]);

  const visibleDrafts = useMemo(() => {
    if (categoryFilter === 'All') {
      return drafts;
    }
    return drafts.filter((draft) => draft.category === categoryFilter);
  }, [drafts, categoryFilter]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {categories.map((category) => {
          const isActive = categoryFilter === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#C96F55] text-white border-[#C96F55] shadow-xs font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="live-cards-grid">
        {visibleDrafts.map((draft) => {
          const formattedId = draft.id.startsWith('#') ? draft.id : `#${draft.id}`;
          return (
            <div
              key={draft.id}
              className="live-card group"
              onClick={() => onOpenArticle(draft)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenArticle(draft);
                }
              }}
            >
              <div>
                <div className="live-card-top">
                  <span className="live-card-id">{formattedId}</span>

                  <div className="live-card-badges">
                    <SlaBadge slaTimeLeft={draft.slaTimeLeft} />
                    <StatusBadge status={draft.status} size="sm" />
                  </div>
                </div>

                <h3 className="live-card-title">{draft.summaryTitle}</h3>

                {draft.summarySubtitle && (
                  <p className="live-card-subtitle">{draft.summarySubtitle}</p>
                )}
              </div>

              <div>
                <div className="live-card-meta">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="live-card-category">{draft.category}</span>
                    {draft.priority && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                        style={{
                          backgroundColor:
                            draft.priority === 'Critical'
                              ? '#fee2e2'
                              : draft.priority === 'High'
                              ? '#ffedd5'
                              : '#f1f5f9',
                          color:
                            draft.priority === 'Critical'
                              ? '#dc2626'
                              : draft.priority === 'High'
                              ? '#ea580c'
                              : '#475569',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              draft.priorityColor ||
                              (draft.priority === 'Critical'
                                ? '#dc2626'
                                : draft.priority === 'High'
                                ? '#ea580c'
                                : '#64748b'),
                          }}
                        />
                        {draft.priority}
                      </span>
                    )}
                  </div>

                  {draft.team && (
                    <span className="live-card-team">{draft.team}</span>
                  )}
                </div>

                <div className="live-card-footer">
                  <div className="live-card-author">
                    <span className="live-card-author-avatar">
                      {getInitials(draft.author)}
                    </span>
                    <span>By {draft.author}</span>
                  </div>

                  <span className="live-card-link">
                    <span>View details</span>
                    <span className="inline-block transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleDrafts.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center my-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl mb-3">
            📄
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">No article drafts found</h4>
          <p className="text-xs text-slate-400">
            {categoryFilter !== 'All'
              ? `No articles found in category "${categoryFilter}".`
              : 'No draft articles match the current filter or search criteria.'}
          </p>
        </div>
      )}
    </div>
  );
}
