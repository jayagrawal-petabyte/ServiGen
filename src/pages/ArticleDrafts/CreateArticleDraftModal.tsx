import React, { useState } from 'react';
import type { ArticleDraft, ArticleDraftStatus } from './mockArticleDraftsData';

interface CreateArticleDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDraft: (draftData: Omit<ArticleDraft, 'id'>) => Promise<void> | void;
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

export default function CreateArticleDraftModal({
  isOpen,
  onClose,
  onCreateDraft,
}: CreateArticleDraftModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState('High');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('Aditya Kumar Singh');
  const [team, setTeam] = useState('Frontend Core');
  const [slaDays, setSlaDays] = useState('3');
  const [submitAsAwaiting, setSubmitAsAwaiting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    subtitle?: string;
    body?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { title?: string; subtitle?: string; body?: string } = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Article title is required.';
    } else if (trimmedTitle.length < 3) {
      newErrors.title = 'Title must be at least 3 characters.';
    } else if (trimmedTitle.length > 120) {
      newErrors.title = 'Title cannot exceed 120 characters.';
    }

    const trimmedSub = subtitle.trim();
    if (!trimmedSub) {
      newErrors.subtitle = 'Short summary / subtitle is required.';
    } else if (trimmedSub.length < 5) {
      newErrors.subtitle = 'Summary must be at least 5 characters.';
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      newErrors.body = 'Article content body is required.';
    } else if (trimmedBody.length < 10) {
      newErrors.body = 'Content must be at least 10 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const priorityObj = PRIORITIES.find((p) => p.label === priority);
      const initialStatus: ArticleDraftStatus = submitAsAwaiting
        ? 'Awaiting Approval'
        : 'Draft';

      await onCreateDraft({
        summaryTitle: title.trim(),
        summarySubtitle: subtitle.trim(),
        category,
        priority,
        priorityColor: priorityObj?.color || '#a16207',
        status: initialStatus,
        type: 'Article Draft',
        slaTimeLeft: `${slaDays}d 0h left`,
        slaStatus: Number(slaDays) <= 1 ? 'warning' : 'safe',
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).replace(/ /g, '-'),
        author: author.trim() || 'Demo User',
        agent: author.trim() || 'Demo User',
        team: team.trim() || 'General Operations',
        body: body.trim(),
      });

      // Reset and close
      setTitle('');
      setSubtitle('');
      setBody('');
      setErrors({});
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#eb6a47' }}>
              Knowledge Base Management
            </span>
            <h2 style={{ marginTop: '2px', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              Create New Article Draft
            </h2>
          </div>

          <button
            className="btn-close-modal"
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Article Title <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {title.length}/120
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. How to Configure VPN Client Access on Windows 11"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  border: `1.5px solid ${errors.title ? '#ef4444' : '#cbd5e1'}`,
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.title && (
                <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {errors.title}
                </div>
              )}
            </div>

            {/* Subtitle / Short Summary */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Summary / Subtitle <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Step-by-step diagnostic and setup instructions for remote staff"
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  if (errors.subtitle) setErrors((prev) => ({ ...prev, subtitle: undefined }));
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: `1.5px solid ${errors.subtitle ? '#ef4444' : '#cbd5e1'}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.subtitle && (
                <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {errors.subtitle}
                </div>
              )}
            </div>

            {/* Category & Priority Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Category <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Author, Team & SLA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Team / Department
                </label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  SLA Target
                </label>
                <select
                  value={slaDays}
                  onChange={(e) => setSlaDays(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="1">1 Day</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                </select>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Article Content (Markdown) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Min 10 characters
                </span>
              </div>
              <textarea
                rows={6}
                placeholder="## Overview&#10;Write the knowledge base instructions, prerequisites, and resolution steps here..."
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (errors.body && e.target.value.trim().length >= 10) {
                    setErrors((prev) => ({ ...prev, body: undefined }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '7px',
                  border: `1.5px solid ${errors.body ? '#ef4444' : '#cbd5e1'}`,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.body && (
                <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {errors.body}
                </div>
              )}
            </div>

            {/* Checkbox: Submit directly for approval */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <input
                id="submit-as-awaiting"
                type="checkbox"
                checked={submitAsAwaiting}
                onChange={(e) => setSubmitAsAwaiting(e.target.checked)}
                style={{ accentColor: '#eb6a47', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label
                htmlFor="submit-as-awaiting"
                style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500, cursor: 'pointer' }}
              >
                Submit directly for manager approval (Status: <strong>Awaiting Approval</strong>)
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-approval-action"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#eb6a47',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '13px',
                boxShadow: '0 2px 6px rgba(235, 106, 71, 0.3)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Creating Draft...' : submitAsAwaiting ? 'Submit for Approval' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
