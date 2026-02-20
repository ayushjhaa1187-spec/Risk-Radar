import { useMemo } from 'react';

export default function Filters({ regions = [], selectedRegion, setRegion, severity, setSeverity }) {
  const regionOptions = useMemo(() => [{ region_code: 'all', region_name: 'All regions' }, ...regions], [regions]);
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Filters</p>
          <h3 className="text-lg font-semibold text-white">Scope & sensitivity</h3>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-200">
          <span>Region</span>
          <select
            value={selectedRegion}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-xl border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            {regionOptions.map((region) => (
              <option key={region.region_code} value={region.region_code}>
                {region.region_name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <div className="flex items-center justify-between">
            <span>Minimum severity</span>
            <span className="text-xs text-slate-400">{severity}+</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </label>
      </div>
    </div>
  );
}
