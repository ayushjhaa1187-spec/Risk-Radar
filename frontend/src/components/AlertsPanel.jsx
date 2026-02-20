import { Bell, Clock } from 'lucide-react';
import { formatDate, severityColor } from '../utils/formatters';

export default function AlertsPanel({ alerts = [] }) {
  return (
    <div className="card h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-brand-300" />
          <div>
            <p className="text-sm text-slate-400">Proactive notices</p>
            <h3 className="text-lg font-semibold text-white">Early warnings</h3>
          </div>
        </div>
        <button className="btn-ghost text-xs">Subscribe</button>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.risk_id} className="flex items-start justify-between rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`pill ${severityColor(alert.severity)}`}>Severity {alert.severity}</span>
                <span className="text-xs uppercase tracking-wide text-slate-400">{alert.risk_id}</span>
              </div>
              <p className="text-sm font-semibold text-white">{alert.title}</p>
              <p className="text-xs text-slate-400">OEMs affected: {alert.oems_affected}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-300">
              <Clock size={14} />
              {alert.time_to_impact_days}d
            </div>
          </div>
        ))}
        {alerts.length === 0 && <p className="text-sm text-slate-400">No alerts for this filter.</p>}
      </div>
    </div>
  );
}
