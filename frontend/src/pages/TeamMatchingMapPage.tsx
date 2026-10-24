import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '../lib/api';

interface Captain {
  id: string;
  name: string;
}

interface TeamMarker {
  id: string;
  name: string;
  project_idea: string | null;
  needed_roles: string[];
  lat: number;
  lng: number;
  captain: Captain;
}

interface ParticipantMarker {
  id: string;
  name: string;
  skills: string[];
  roles: string[];
  lat: number;
  lng: number;
}

interface MapData {
  teams: TeamMarker[];
  participants: ParticipantMarker[];
}

// Blue square icon for teams
const teamIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#3b82f6;border:2px solid #1d4ed8;border-radius:3px;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

// Green circle icon for participants
const participantIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#22c55e;border:2px solid #15803d;border-radius:50%;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

// Tampere University coordinates
const TAMPERE_CENTER: [number, number] = [61.4978, 23.761];

export default function TeamMatchingMapPage() {
  const [mapData, setMapData] = useState<MapData>({ teams: [], participants: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/map/teams')
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error ?? 'Failed to load map data');
        }
        return res.json() as Promise<MapData>;
      })
      .then((data) => setMapData(data))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navigation bar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#1e40af',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Junction Matchmaker</span>
        <Link to="/map/teams" style={{ color: '#bfdbfe', textDecoration: 'none', fontWeight: 600 }}>
          Team Map
        </Link>
        <Link to="/map/mentors" style={{ color: '#bfdbfe', textDecoration: 'none' }}>
          Mentor Map
        </Link>
        <Link to="/profile" style={{ color: '#bfdbfe', textDecoration: 'none', marginLeft: 'auto' }}>
          Profile
        </Link>
      </nav>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          padding: '0.4rem 1rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.8rem',
          flexShrink: 0,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              background: '#3b82f6',
              border: '2px solid #1d4ed8',
              borderRadius: 3,
            }}
          />
          Teams recruiting
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              background: '#22c55e',
              border: '2px solid #15803d',
              borderRadius: '50%',
            }}
          />
          Looking for team
        </span>
        {error && <span style={{ color: '#dc2626', marginLeft: 'auto' }}>Error: {error}</span>}
      </div>

      {/* Full-screen map */}
      <MapContainer
        center={TAMPERE_CENTER}
        zoom={15}
        style={{ flex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapData.teams.map((team) => (
          <Marker key={team.id} position={[team.lat, team.lng]} icon={teamIcon}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong style={{ fontSize: '0.95rem' }}>{team.name}</strong>
                {team.project_idea && (
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#374151' }}>
                    {team.project_idea}
                  </p>
                )}
                {team.needed_roles.length > 0 && (
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    <strong>Needs:</strong> {team.needed_roles.join(', ')}
                  </p>
                )}
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                  Captain: {team.captain.name}
                </p>
                <button
                  onClick={() => alert('Feature coming in ticket 06')}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.3rem 0.7rem',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    width: '100%',
                  }}
                >
                  Request to Join
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {mapData.participants.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={participantIcon}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                {p.roles.length > 0 && (
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#374151' }}>
                    <strong>Roles:</strong> {p.roles.join(', ')}
                  </p>
                )}
                {p.skills.length > 0 && (
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#374151' }}>
                    <strong>Skills:</strong> {p.skills.join(', ')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
