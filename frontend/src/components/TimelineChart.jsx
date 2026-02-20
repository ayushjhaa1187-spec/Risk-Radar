import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate } from '../utils/formatters';

function buildSeries(events) {
  const byDate = new Map();
  events.forEach((event) => {
    const key = formatDate(event.detected_date || event.timestamp || event.occurrence_date);
    byDate.set(key, (byDate.get(key) || 0) + (event.severity || 1));
  });
  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}

export default function TimelineChart({ events = [] }) {
  const data = buildSeries(events);
  return (
    <div className="card h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Temporal intensity</p>
          <h3 className="text-lg font-semibold text-white">Event timeline</h3>
        </div>
        <span className="pill bg-[rgba(148,163,184,0.08)] text-slate-200">Last 30 days</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value) => [value, 'Severity sum']}
            />
            <Area type="monotone" dataKey="value" stroke="#f97316" fillOpacity={1} fill="url(#colorRisk)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
