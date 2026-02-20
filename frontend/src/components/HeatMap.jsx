import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function HeatMap({ events = [] }) {
  const center = events.find((e) => e.geo_coordinates) || { geo_coordinates: { latitude: -12, longitude: -77 } };
  return (
    <div className="card h-full overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Regional pressure</p>
          <h3 className="text-lg font-semibold text-white">Heat map</h3>
        </div>
        <span className="pill bg-[rgba(234,88,12,0.12)] text-brand-300">Copper</span>
      </div>
      <div className="relative h-80 w-full rounded-xl overflow-hidden border border-[rgba(148,163,184,0.15)]">
        <MapContainer
          center={[center.geo_coordinates.latitude, center.geo_coordinates.longitude]}
          zoom={4}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url={tileUrl} />
          {events
            .filter((e) => e.geo_coordinates)
            .map((event) => (
              <CircleMarker
                key={event.event_id}
                center={[event.geo_coordinates.latitude, event.geo_coordinates.longitude]}
                radius={6 + event.severity * 2}
                pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.45 }}
              >
                <Tooltip direction="top">
                  <div className="text-xs">
                    <div className="font-semibold">{event.title}</div>
                    <div>Severity {event.severity}</div>
                    <div>{event.region?.toUpperCase()}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
