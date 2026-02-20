import { format, parseISO } from 'date-fns';

export function formatUSD(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value, digits = 0) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d');
  } catch (e) {
    return iso;
  }
}

export function severityColor(level) {
  const colors = {
    1: 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/30',
    2: 'text-amber-300 bg-amber-500/10 border border-amber-500/30',
    3: 'text-orange-300 bg-orange-500/10 border border-orange-500/30',
    4: 'text-red-300 bg-red-500/10 border border-red-500/30',
    5: 'text-red-200 bg-red-500/20 border border-red-500/40',
  };
  return colors[level] || 'text-slate-200 bg-slate-500/10 border border-slate-500/30';
}
