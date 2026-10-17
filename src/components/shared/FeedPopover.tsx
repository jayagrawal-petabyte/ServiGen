import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FeedPopover.css';

interface FeedPopoverProps {
  onClose: () => void;
  onOpenTicket?: (ticketId: string) => void;
}

export const FeedPopover: React.FC<FeedPopoverProps> = ({ onClose, onOpenTicket }) => {
  const navigate = useNavigate();

  const handleTicketClick = (ticketId: string) => {
    if (onOpenTicket) {
      onOpenTicket(ticketId);
    } else {
      onClose();
      navigate(`/major-incidents/live?incident=${ticketId}`);
    }
  };

  return (
    <div className="feed-floating-popover">
      {/* Header */}
      <div className="feed-popover-header">
        <h3 className="feed-popover-title">Feed</h3>
        <button
          type="button"
          className="feed-popover-close-btn"
          onClick={onClose}
          title="Close Feed"
        >
          ✕
        </button>
      </div>

      {/* Subheader Filter & Popout */}
      <div className="feed-subheader-row">
        <div className="feed-filter-dropdown cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors">
          <span>All Activity</span>
          <span className="dropdown-caret">▾</span>
        </div>
        <button 
          type="button" 
          className="feed-popout-btn hover:text-cyan-500 hover:bg-gray-100 rounded p-0.5 transition-colors cursor-pointer" 
          title="Open feed in full window"
          onClick={() => {
            onClose();
            navigate('/major-incidents/feed');
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </button>
      </div>

      {/* Feed Cards Stack (Exact Match to Image 1) */}
      <div className="feed-cards-stack">
        {/* Card 1: Demo User */}
        <div className="feed-card-item">
          <div className="feed-card-top">
            <div className="feed-avatar-circle bg-[#00bcd4]">
              DU
            </div>
            <div className="feed-card-meta">
              <div className="feed-author-line">
                <span className="feed-author-name">Demo User</span>
                <span className="feed-author-org">(consultancy/EMEA)</span>
              </div>
              <button
                type="button"
                className="feed-ticket-link"
                onClick={() => handleTicketClick('0003995')}
              >
                <span className="ticket-num">#3995</span>
                <span className="ticket-dash">-</span>
                <span className="ticket-action">New Ticket Logged</span>
              </button>
            </div>
            <span className="feed-timestamp">16 days ago</span>
          </div>
          <p className="feed-snippet-text">Emails not Sending</p>
        </div>

        {/* Card 2: Jennifer Williams */}
        <div className="feed-card-item">
          <div className="feed-card-top">
            <div className="feed-avatar-circle bg-[#00bcd4]">
              JW
            </div>
            <div className="feed-card-meta">
              <div className="feed-author-line">
                <span className="feed-author-name">Jennifer Williams</span>
                <span className="feed-author-org">(Halo/EMEA)</span>
              </div>
              <button
                type="button"
                className="feed-ticket-link"
                onClick={() => handleTicketClick('0003994')}
              >
                <span className="ticket-num">#3994</span>
                <span className="ticket-dash">-</span>
                <span className="ticket-action">User Update</span>
              </button>
            </div>
            <span className="feed-timestamp">23 days ago</span>
          </div>
          <p className="feed-snippet-text">
            Every time it slows down, it says something about disk errors?
          </p>
        </div>

        {/* Card 3: Email User */}
        <div className="feed-card-item">
          <div className="feed-card-top">
            <div className="feed-speech-avatar-wrap">
              <div className="feed-speech-bubble">
                <svg className="w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
                </svg>
              </div>
              <span className="feed-green-dot" />
            </div>
            <div className="feed-card-meta">
              <div className="flex items-center gap-1.5">
                <span className="trophy-gold">🏆</span>
                <button
                  type="button"
                  className="feed-ticket-link"
                  onClick={() => handleTicketClick('0003994')}
                >
                  <span className="ticket-num">#3994</span>
                  <span className="ticket-dash">-</span>
                  <span className="ticket-action font-bold">Email User</span>
                </button>
              </div>
            </div>
            <span className="feed-timestamp">23 days ago</span>
          </div>
          <div className="feed-email-body-text">
            <p>Hi Aisha,</p>
            <p>Thank you for reaching out.</p>
            <p>
              Would you be able to provide some further information on your issue?
              Are you seeing any errors whilst it is slowing down?
            </p>
          </div>
        </div>

        {/* Card 4: Triaged */}
        <div className="feed-card-item">
          <div className="feed-card-top">
            <div className="feed-speech-avatar-wrap">
              <div className="feed-speech-bubble">
                <svg className="w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
                </svg>
              </div>
              <span className="feed-green-dot" />
            </div>
            <div className="feed-card-meta">
              <div className="flex items-center gap-1.5">
                <span className="trophy-gold">🏆</span>
                <button
                  type="button"
                  className="feed-ticket-link"
                  onClick={() => handleTicketClick('0003994')}
                >
                  <span className="ticket-num">#3994</span>
                  <span className="ticket-dash">-</span>
                  <span className="ticket-action font-bold">Triaged</span>
                </button>
              </div>
            </div>
            <span className="feed-timestamp">23 days ago</span>
          </div>
          <div className="feed-snippet-text feed-triaged-content">
            <p className="mb-2">Admin has triaged this ticket and assigned it to 1st Line Support.</p>
            <div className="feed-triaged-meta">
              <p>Impact: Single User Affected</p>
              <p>Urgency: Medium</p>
              <p>Category: Hardware&gt;Laptop&gt;Physical Damage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPopover;
