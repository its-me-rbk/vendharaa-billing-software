import { twMerge } from 'tailwind-merge';

function clsx(...args) {
  return args.flat().filter(Boolean).join(' ');
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return `₹${(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN');
}

export function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return formatDate(dateStr);
}

export function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
