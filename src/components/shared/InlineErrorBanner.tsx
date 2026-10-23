import React from 'react';

interface InlineErrorBannerProps {
  message: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Inline failure notice for a screen whose data could not be loaded.
 *
 * Screens used to swallow fetch errors and keep their previous rows, which made
 * "the request failed" indistinguishable from "there is nothing here".
 */
export const InlineErrorBanner: React.FC<InlineErrorBannerProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`mx-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[12px] text-rose-900 ${className}`}
    >
      <span className="font-semibold">Couldn’t load this screen.</span>
      <span className="flex-1 min-w-[180px]">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-rose-400 px-2 py-0.5 font-semibold hover:bg-rose-100"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default InlineErrorBanner;
