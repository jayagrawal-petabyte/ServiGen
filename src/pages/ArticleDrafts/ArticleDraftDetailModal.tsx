import React, { useState } from 'react';
import type {
  ArticleDraft,
} from './mockArticleDraftsData';

interface ArticleDraftDetailModalProps {
  article: ArticleDraft | null;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    newStatus: ArticleDraft['status']
  ) => void;
  onSaveContent?: (
    id: string,
    updates: Pick<ArticleDraft, 'summaryTitle' | 'body'>
  ) => void;
}

export default function ArticleDraftDetailModal({
  article,
  onClose,
  onUpdateStatus,
  onSaveContent,
}: ArticleDraftDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [editedTitle, setEditedTitle] = useState(
    article ? article.summaryTitle : ''
  );

  const [editedBody, setEditedBody] = useState(
    article ? article.body : ''
  );

  if (!article) return null;

  const handleSave = () => {
    onSaveContent?.(article.id, {
      summaryTitle: editedTitle,
      body: editedBody,
    });

    setIsEditing(false);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4, 1fr)',
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

          {isEditing ? (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '4px',
                }}
              >
                Article Title
              </label>

              <input
                type="text"
                value={editedTitle}
                onChange={(e) =>
                  setEditedTitle(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
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
                Draft Article Content
              </span>

              <button
                type="button"
                onClick={() =>
                  setIsEditing(!isEditing)
                }
                style={{
                  fontSize: '12px',
                  color: '#1d68c9',
                  fontWeight: 600,
                }}
              >
                {isEditing
                  ? 'Cancel Edit'
                  : '✎ Edit Content'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                rows={10}
                value={editedBody}
                onChange={(e) =>
                  setEditedBody(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
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
                {article.body ||
                  'No draft content specified yet.'}
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
                style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Save Changes
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
                onClick={() => {
                  onUpdateStatus(
                    article.id,
                    'Awaiting Approval'
                  );
                  onClose();
                }}
                style={{
                  backgroundColor: '#1e293b',
                  color: 'white',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Submit for Approval
              </button>
            )}

            {article.status === 'Awaiting Approval' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(
                      article.id,
                      'Draft'
                    );
                    onClose();
                  }}
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
                  onClick={() => {
                    onUpdateStatus(
                      article.id,
                      'Published'
                    );
                    onClose();
                  }}
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
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}