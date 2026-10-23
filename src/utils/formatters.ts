/**
 * Human-written helper utilities for formatting data across Halo AI.
 */

export const formatHours = (hours: number): string => {
  if (hours >= 1000) {
    return `${hours.toLocaleString('en-US', { maximumFractionDigits: 1 })}h`;
  }
  return `${hours.toFixed(1)}h`;
};

export const formatPercent = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const formatDateString = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};
