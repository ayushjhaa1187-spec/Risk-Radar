import { formatPercent } from '../utils/formatters';

export default function ExposureTable({ exposure }) {
  if (!exposure) return null;
  const rows = exposure.commodity_exposures || [];
  return (
    <div className="card h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Downstream exposure</p>
          <h3 className="text-lg font-semibold text-white">{exposure.oem?.name || 'OEM exposure'}</h3>
        </div>
        <div className="pill bg-[rgba(148,163,184,0.08)]">
          Risk score {exposure.exposure_summary?.risk_score ?? '—'}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[rgba(148,163,184,0.15)]">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-[rgba(255,255,255,0.03)] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Commodity</th>
              <th className="px-4 py-3 text-left">Dependency</th>
              <th className="px-4 py-3 text-left">Top region</th>
              <th className="px-4 py-3 text-left">Tier-2 suppliers</th>
              <th className="px-4 py-3 text-left">Active risks</th>
              <th className="px-4 py-3 text-left">Disruption (6w)</th>
              <th className="px-4 py-3 text-left">Alternatives</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.commodity} className="border-t border-[rgba(148,163,184,0.1)]">
                <td className="px-4 py-3 font-semibold text-white">{row.commodity}</td>
                <td className="px-4 py-3">{formatPercent(row.dependency_pct)}</td>
                <td className="px-4 py-3 capitalize">{row.top_source_region}</td>
                <td className="px-4 py-3">{row.tier2_suppliers}</td>
                <td className="px-4 py-3">{row.active_risks_count}</td>
                <td className="px-4 py-3">{formatPercent(row.disruption_probability_6w * 100, 0)}</td>
                <td className="px-4 py-3">
                  {row.alternative_suppliers?.map((alt) => (
                    <div key={`${alt.region}-${alt.capacity_available_tonnes}`} className="text-xs text-slate-300">
                      {alt.region} · {alt.capacity_available_tonnes}t · {alt.lead_time_weeks}w lead
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
