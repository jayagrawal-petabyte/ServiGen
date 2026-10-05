import React, { useState } from 'react';
import type {
  ArticleDraft,
  ArticleDraftStatus,
} from './mockArticleDraftsData';

interface ArticleDraftDetailModalProps {
  article: ArticleDraft;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: ArticleDraftStatus
  ) => Promise<void> | void;
  onSaveContent: (
    id: string,
    updates: Partial<ArticleDraft>
  ) => Promise<void> | void;
}

const CATEGORIES = [
  'Email & Messaging',
  'HR Self-Service',
  'HR Systems',
  'Localization & Time',
  'Hardware & Printing',
  'Network & Remote',
  'Security & Access',
  'Collaboration',
  'Cloud Infrastructure',
];

const PRIORITIES = [
  { label: 'High', color: '#a16207' },
  { label: 'Medium', color: '#c27803' },
  { label: 'Low', color: '#64748b' },
  { label: 'Critical', color: '#dc2626' },
];

export default function ArticleDraftDetailModal({
  article,
  onClose,
  onUpdateStatus,
  onSaveContent,
}: ArticleDraftDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article ? article.summaryTitle : '');
  const [editedSubtitle, setEditedSubtitle] = useState(article ? article.summarySubtitle : '');
  const [editedCategory, setEditedCategory] = useState(article ? article.category : CATEGORIES[0]);
  const [editedPriority, setEditedPriority] = useState(article ? article.priority : 'High');
  const [editedBody, setEditedBody] = useState(article ? article.body : '');

  const [titleError, setTitleError] = useState<string | null>(null);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!article) return null;

  const validate = (): boolean => {
    let isValid = true;
    const trimmedTitle = editedTitle.trim();
    const trimmedSubtitle = editedSubtitle.trim();
    const trimmedBody = editedBody.trim();

    if (!trimmedTitle) {
      setTitleError('Article title is required.');
      isValid = false;
    } else if (trimmedTitle.length < 3) {
      setTitleError('Article title must be at least 3 characters.');
      isValid = false;
    } else if (trimmedTitle.length > 120) {
      setTitleError('Article title cannot exceed 120 characters.');
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (!trimmedSubtitle) {
      setSubtitleError('Summary subtitle is required.');
      isValid = false;
    } else {
      setSubtitleError(null);
    }

    if (!trimmedBody) {
      setBodyError('Article body content is required.');
      isValid = false;
    } else if (trimmedBody.length < 10) {
      setBodyError('Article body content must be at least 10 characters.');
      isValid = false;
    } else {
      setBodyError(null);
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const priorityObj = PRIORITIES.find((p) => p.label === editedPriority);
      await onSaveContent?.(article.id, {
        summaryTitle: editedTitle.trim(),
        summarySubtitle: editedSubtitle.trim(),
        category: editedCategory,
        priority: editedPriority,
        priorityColor: priorityObj?.color || '#a16207',
        body: editedBody.trim(),
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusTransition = async (newStatus: ArticleDraftStatus) => {
    if (newStatus === 'Awaiting Approval') {
      if (!article.summaryTitle || article.summaryTitle.trim().length < 3) {
        alert('Validation Error: Article title must be at least 3 characters before submitting for approval.');
        return;
      }
      if (!article.body || article.body.trim().length < 10) {
        alert('Validation Error: Article draft content must be at least 10 characters before submitting for approval.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onUpdateStatus(article.id, newStatus);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#1d68c9',
              }}
            >
              {article.id}
            </span>

            <span
              className={`status-pill ${
                article.status === 'Awaiting Approval'
                  ? 'awaiting'
                  : article.status.toLowerCase()
              }`}
            >
              {article.status}
            </span>
          </div>

          <button
            className="btn-close-modal"
            onClick={onClose}
            type="button"
            aria-label="Close modal"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '20px',
              padding: '12px 14px',
              backgroundColor: '#faf6f2',
              borderRadius: '10px',
              border: '1px solid #f1eae2',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                SLA Left
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  marginTop: '2px',
                  color:
                    article.slaStatus === 'overdue'
                      ? '#e11d48'
                      : '#1e293b',
                }}
              >
                {article.slaTimeLeft}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Category
              </div>

              {isEditing ? (
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  style={{
                    fontSize: '12px',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    marginTop: '2px',
                    width: '100%',
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    marginTop: '2px',
                    color: '#1e293b',
                  }}
                >
                  {article.category}
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Priority
              </div>

              {isEditing ? (
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value)}
                  style={{
                    fontSize: '12px',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    marginTop: '2px',
                    width: '100%',
                  }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    marginTop: '2px',
                    color:
                      article.priorityColor ||
                      '#1e293b',
                  }}
                >
                  {article.priority}
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Author
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  marginTop: '2px',
                  color: '#1e293b',
                }}
              >
                {article.author}
              </div>
            </div>
          </div>

          {/* Title & Subtitle Edit or View */}
          {isEditing ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label
                    htmlFor="edit-title-input"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#475569',
                    }}
                  >
                    Article Title <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {editedTitle.length}/120
                  </span>
                </div>

                <input
                  id="edit-title-input"
                  type="text"
                  value={editedTitle}
                  onChange={(e) => {
                    setEditedTitle(e.target.value);
                    if (titleError && e.target.value.trim().length >= 3) {
                      setTitleError(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1.5px solid ${titleError ? '#ef4444' : '#cbd5e1'}`,
                    fontSize: '15px',
                    fontWeight: 600,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />

                {titleError && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ {titleError}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-subtitle-input"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '4px',
                  }}
                >
                  Summary Subtitle <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="edit-subtitle-input"
                  type="text"
                  value={editedSubtitle}
                  onChange={(e) => {
                    setEditedSubtitle(e.target.value);
                    if (subtitleError) setSubtitleError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1.5px solid ${subtitleError ? '#ef4444' : '#cbd5e1'}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                {subtitleError && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ {subtitleError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <h2
                style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '4px',
                }}
              >
                {article.summaryTitle}
              </h2>

              <p
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                }}
              >
                {article.summarySubtitle}
              </p>
            </div>
          )}

          {/* Body Content */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                Draft Article Content <span style={{ color: '#dc2626' }}>*</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setTitleError(null);
                  setSubtitleError(null);
                  setBodyError(null);
                }}
                style={{
                  fontSize: '12px',
                  color: '#1d68c9',
                  fontWeight: 600,
                }}
              >
                {isEditing ? 'Cancel Edit' : '✎ Edit Content'}
              </button>
            </div>

            {isEditing ? (
              <div>
                <textarea
                  rows={10}
                  value={editedBody}
                  onChange={(e) => {
                    setEditedBody(e.target.value);
                    if (bodyError && e.target.value.trim().length >= 10) {
                      setBodyError(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${bodyError ? '#ef4444' : '#cbd5e1'}`,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />

                {bodyError && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ {bodyError}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {article.body || 'No draft content specified yet.'}
              </div>
            )}
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            justifyContent: 'space-between',
          }}
        >
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '13px',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
            }}
          >
            {article.status === 'Draft' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleStatusTransition('Awaiting Approval')}
                style={{
                  backgroundColor: '#1e293b',
                  color: 'white',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '13px',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            )}

            {article.status === 'Awaiting Approval' && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleStatusTransition('Draft')}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '7px 14px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Recall to Draft
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleStatusTransition('Published')}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    padding: '7px 16px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Approve & Publish
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-approval-action"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}