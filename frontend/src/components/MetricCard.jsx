import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';

export default function MetricCard({ title, value, delta, tone = 'neutral', caption }) {
  const deltaPositive = delta && delta.value > 0;
  return (
    <div className="card h-full space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        {delta && (
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
              deltaPositive ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200',
            )}
          >
            {deltaPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta.value}
            {delta.suffix || '%'}
          </span>
        )}
      </div>
      <div className="text-3xl font-display font-semibold text-white">{value}</div>
      {caption && <p className="text-sm text-slate-400">{caption}</p>}
      {tone === 'risk' && <div className="h-1 w-full rounded-full bg-brand-900/60">
        <div className="h-1 rounded-full bg-brand-500" style={{ width: '70%' }} />
      </div>}
    </div>
  );
}
