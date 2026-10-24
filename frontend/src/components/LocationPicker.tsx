import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon broken by webpack/vite bundling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Tampere University default center
const DEFAULT_LAT = 61.4978;
const DEFAULT_LNG = 23.761;

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const markerLat = lat ?? DEFAULT_LAT;
  const markerLng = lng ?? DEFAULT_LNG;
  const hasPin = lat !== null && lng !== null;

  // Track if map is already initialized to avoid re-center on re-render
  const centerRef = useRef<[number, number]>([markerLat, markerLng]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        alert('Unable to retrieve your location. Please check permissions.');
      }
    );
  }

  // Update center ref only on mount
  useEffect(() => {
    centerRef.current = [markerLat, markerLng];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Use my location
        </button>
        {hasPin && (
          <span className="text-sm text-gray-500">
            {lat!.toFixed(5)}, {lng!.toFixed(5)}
          </span>
        )}
      </div>
      <div className="rounded overflow-hidden border border-gray-200" style={{ height: 300 }}>
        <MapContainer
          center={centerRef.current}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onChange={onChange} />
          {hasPin && <Marker position={[lat!, lng!]} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400">Click on the map to place a pin.</p>
    </div>
  );
}
