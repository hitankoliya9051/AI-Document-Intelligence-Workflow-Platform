import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateStr);
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400',
      };
    case 'processing':
      return {
        label: 'Processing',
        bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-600 dark:bg-purple-400 animate-pulse',
      };
    case 'review_required':
      return {
        label: 'Review Required',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400',
      };
    case 'failed':
      return {
        label: 'Failed',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-400',
      };
    case 'uploaded':
    default:
      return {
        label: 'Uploaded',
        bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
        dot: 'bg-slate-400',
      };
  }
}

export function getConfidenceBadge(score: number) {
  const percentage = Math.round(score * 100);
  if (percentage >= 90) {
    return {
      text: `${percentage}% High`,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };
  }
  if (percentage >= 75) {
    return {
      text: `${percentage}% Good`,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
  }
  return {
    text: `${percentage}% Review`,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
}
