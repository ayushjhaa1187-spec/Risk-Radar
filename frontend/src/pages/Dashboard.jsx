import { useMemo, useState } from 'react';
import { Activity, AlertCircle, Database, Loader2 } from 'lucide-react';
import Filters from '../components/Filters';
import MetricCard from '../components/MetricCard';
import RegionCard from '../components/RegionCard';
import EventFeed from '../components/EventFeed';
import TimelineChart from '../components/TimelineChart';
import HeatMap from '../components/HeatMap';
import ExposureTable from '../components/ExposureTable';
import AlertsPanel from '../components/AlertsPanel';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatPercent } from '../utils/formatters';

export default function Dashboard() {
  const [region, setRegion] = useState('peru');
  const [severity, setSeverity] = useState(2);
  const { data, isLoading } = useDashboardData({ region, severity });

  const summary = data?.summary;
  const events = data?.events || [];
  const risks = data?.risks || [];
  const exposure = data?.exposure;
  const regions = data?.regions || [];

  const regionRiskScore = useMemo(() => {
    if (!summary?.regions) return '—';
    const match = summary.regions.find((r) => (region === 'all' ? r : r.region === region));
    return match ? match.risk_score.toFixed(2) : '—';
  }, [summary, region]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="animate-spin text-brand-400" size={32} />
      </div>
    );
  }

  return (
    <main className="flex-1 bg-surface pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-8 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
            <h1 className="text-3xl font-display font-semibold text-white">Copper risk · Automotive</h1>
            <p className="text-sm text-slate-400">
              Monitoring Peru, Mexico, Vietnam. Focus: strike votes, permit suspensions, port outages.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs text-slate-200">
            <Database size={14} className="text-brand-300" />
            Data source: {data?.source === 'api' ? 'API' : 'Mock (offline)'}
            {data?.source !== 'api' && <AlertCircle size={14} className="text-amber-300" />}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Global risk score" value={summary?.global_risk_score?.toFixed(2) ?? '—'} tone="risk" />
          <MetricCard
            title="Active risks"
            value={summary?.active_risks_count ?? '—'}
            delta={{ value: +8, suffix: '' }}
            caption="vs last week"
          />
          <MetricCard
            title={`${region === 'all' ? 'Top region' : region.toUpperCase()} risk`}
            value={regionRiskScore}
            caption="Severity-weighted"
          />
          <MetricCard
            title="OEM exposure at risk"
            value={formatPercent(exposure?.exposure_summary?.at_risk_percentage ?? 0)}
            caption="6-week window"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Filters regions={regions} selectedRegion={region} setRegion={setRegion} severity={severity} setSeverity={setSeverity} />
          <AlertsPanel alerts={summary?.critical_alerts || []} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <HeatMap events={events} />
          <TimelineChart events={summary?.recent_events_timeline || events} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <EventFeed events={events} />
          <div className="space-y-4">
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-brand-300" />
                  <div>
                    <p className="text-sm text-slate-400">Active risks</p>
                    <h3 className="text-lg font-semibold text-white">Current incidents</h3>
                  </div>
                </div>
                <span className="pill bg-[rgba(148,163,184,0.08)] text-slate-200">
                  {risks.length} tracked
                </span>
              </div>
              <div className="space-y-3">
                {risks.slice(0, 4).map((risk) => (
                  <div key={risk.risk_id} className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(255,255,255,0.02)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wide text-slate-400">{risk.risk_id}</div>
                        <p className="text-sm font-semibold text-white">{risk.title}</p>
                        <p className="text-xs text-slate-400">Region: {risk.region?.toUpperCase()} · Category: {risk.category?.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <div className="pill bg-[rgba(234,88,12,0.12)] text-brand-200">Severity {risk.severity}</div>
                        <div className="text-xs text-slate-400">Confidence {formatPercent((risk.confidence || 0) * 100, 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ExposureTable exposure={exposure} />
          </div>
        </div>
      </div>
    </main>
  );
}
