import { ArrowUpRight, MapPin } from 'lucide-react';
import clsx from 'clsx';

export default function RegionCard({ region }) {
  const colorMap = {
    red: 'from-rose-500/30 to-amber-500/20 border-rose-500/30',
    orange: 'from-amber-500/30 to-amber-400/10 border-amber-500/30',
    yellow: 'from-amber-300/25 to-emerald-300/10 border-amber-400/25',
  };
  return (
    <div
      className={clsx(
        'card relative overflow-hidden border bg-gradient-to-br p-4',
        colorMap[region.map_color] || 'from-slate-800/50 to-slate-900/50',
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="pill mb-2 bg-[rgba(255,255,255,0.08)]">
            <MapPin size={14} />
            {region.region.toUpperCase()}
          </div>
          <div className="text-2xl font-display font-semibold text-white">{region.risk_score.toFixed(2)}</div>
          <p className="text-sm text-slate-300">Risk score · {region.active_risks} active risks</p>
          <p className="text-xs text-slate-400">Primary: {region.primary_commodities.join(', ')}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.06)] text-white">
          <ArrowUpRight size={18} />
        </div>
      </div>
    </div>
  );
}
