import { Globe2, Link as LinkIcon } from 'lucide-react';
import { formatDate, severityColor } from '../utils/formatters';

export default function EventFeed({ events = [] }) {
  return (
    <div className="card h-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Fresh signals</p>
          <h3 className="text-lg font-semibold text-white">Event feed</h3>
        </div>
        <span className="pill bg-[rgba(148,163,184,0.1)]">
          <Globe2 size={14} />
          Multilingual
        </span>
      </div>

      <div className="space-y-3">
        {events.slice(0, 6).map((event) => (
          <div key={event.event_id} className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`pill ${severityColor(event.severity)}`}>Severity {event.severity}</span>
                  <span className="pill bg-[rgba(148,163,184,0.08)] text-xs uppercase tracking-wide text-slate-200">
                    {event.event_type?.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="mt-2 text-base font-semibold text-white">{event.title}</h4>
                <p className="text-sm text-slate-300">{event.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>{event.region?.toUpperCase()}</span>
                  <span>·</span>
                  <span>Detected {formatDate(event.detected_date)}</span>
                  {event.source_url && (
                    <>
                      <span>·</span>
                      <a className="inline-flex items-center gap-1 text-brand-300 hover:text-brand-200" href={event.source_url} target="_blank" rel="noreferrer">
                        <LinkIcon size={12} />
                        source
                      </a>
                    </>
                  )}
                </div>
              </div>
              {event.geo_coordinates && (
                <div className="text-right text-xs text-slate-400">
                  <div>lat {event.geo_coordinates.latitude.toFixed(2)}</div>
                  <div>lng {event.geo_coordinates.longitude.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-sm text-slate-400">No events for the selected filters.</p>}
      </div>
    </div>
  );
}
