import React, { useState } from 'react';

export default function ArticleDraftsLiveView({
  drafts,
  onOpenArticle,
  onUpdateStatus
}) {
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...new Set(drafts.map((d) => d.category))];

  const visibleDrafts = categoryFilter === 'All'
    ? drafts
    : drafts.filter((d) => d.category === categoryFilter);

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: categoryFilter === cat ? '#1e293b' : '#ffffff',
              color: categoryFilter === cat ? '#ffffff' : '#64748b',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="live-cards-grid">
        {visibleDrafts.map((draft) => (
          <div
            key={draft.id}
            className="live-card"
            onClick={() => onOpenArticle(draft)}
          >
            <div>
              <div className="live-card-top">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d68c9' }}>
                  {draft.id}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {draft.slaStatus === 'overdue' ? (
                    <span className="sla-pill-overdue">Overdue SLA</span>
                  ) : (
                    <span className="sla-dot-text" style={{ fontSize: '11.5px' }}>
                      <span className={`sla-dot ${draft.slaStatus}`} />
                      <span>{draft.slaTimeLeft}</span>
                    </span>
                  )}

                  <span
                    className={`status-pill ${
                      draft.status === 'Awaiting Approval'
                        ? 'awaiting'
                        : draft.status.toLowerCase()
                    }`}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    {draft.status}
                  </span>
                </div>
              </div>

              <h3>{draft.summaryTitle}</h3>
              <p>{draft.summarySubtitle}</p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#475569', fontWeight: 500 }}>
                  {draft.category}
                </span>
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  {draft.team}
                </span>
              </div>

              <div className="live-card-footer">
                <span>By {draft.author}</span>
                <span style={{ color: '#1d68c9', fontWeight: 600 }}>
                  View details →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
