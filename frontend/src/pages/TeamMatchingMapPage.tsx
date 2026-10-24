import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { geoToImagePercent } from '../lib/mapConstants';
import CampusMap from '../components/CampusMap';
import SuggestedTeams from '../components/SuggestedTeams';
import HeroSection from '../components/HeroSection';

interface Captain { id: string; name: string }
interface TeamMarker { id: string; name: string; project_idea: string | null; needed_roles: string[]; lat: number; lng: number; captain: Captain }
interface ParticipantMarker { id: string; name: string; skills: string[]; roles: string[]; lat: number; lng: number }
interface MapData { teams: TeamMarker[]; participants: ParticipantMarker[] }

export default function TeamMatchingMapPage() {
  const { user } = useAuth();
  const [mapData, setMapData] = useState<MapData>({ teams: [], participants: [] });
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<TeamMarker | ParticipantMarker | null>(null);
  const [selectedType, setSelectedType] = useState<'team' | 'participant'>('team');

  useEffect(() => {
    apiFetch('/map/teams')
      .then(async (res) => {
        if (!res.ok) { const b = (await res.json()) as { error: string }; throw new Error(b.error); }
        return res.json() as Promise<MapData>;
      })
      .then(setMapData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  const filteredTeams = useMemo(() => {
    if (!filter.trim()) return mapData.teams;
    const kw = filter.toLowerCase();
    return mapData.teams.filter(
      (t) =>
        t.name.toLowerCase().includes(kw) ||
        t.needed_roles.some((r) => r.toLowerCase().includes(kw)) ||
        t.project_idea?.toLowerCase().includes(kw),
    );
  }, [mapData.teams, filter]);

  return (
    <div className="flex flex-col h-screen" style={{ background: '#1a1814' }}>
      <HeroSection
        totalTeams={mapData.teams.length}
        totalParticipants={mapData.participants.length}
        totalMentors={0}
      />

      {/* Controls bar — dark themed */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: '#242019', borderBottom: '1px solid #3a3530' }}
      >
        <input
          type="text"
          placeholder="Search teams or roles..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-[180px] max-w-xs px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
          style={{
            background: '#1a1814',
            border: '1px solid #3a3530',
            color: '#c4b99a',
          }}
          aria-label="Search teams or roles"
        />

        {/* Legend */}
        <div className="flex items-center gap-4 ml-auto text-xs" style={{ color: '#8a8070' }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded" style={{ background: '#3b82f6' }} />
            Teams
            {filteredTeams.length > 0 && (
              <span className="rounded-full px-1.5 py-0.5 font-semibold" style={{ background: '#2a2520', color: '#c4b99a' }}>
                {filteredTeams.length}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
            Solo hackers
            {mapData.participants.length > 0 && (
              <span className="rounded-full px-1.5 py-0.5 font-semibold" style={{ background: '#2a2520', color: '#c4b99a' }}>
                {mapData.participants.length}
              </span>
            )}
          </span>
        </div>

        {error && <span className="text-red-400 text-xs font-medium">{error}</span>}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {user && <SuggestedTeams />}

        <CampusMap>
          {/* Team markers */}
          {filteredTeams.map((team) => {
            const pos = geoToImagePercent(team.lat, team.lng);
            return (
              <div
                key={team.id}
                className="absolute cursor-pointer"
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => { e.stopPropagation(); setSelected(team); setSelectedType('team'); }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ background: '#3b82f6', border: '2px solid #93c5fd', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            );
          })}

          {/* Participant markers */}
          {mapData.participants.map((p) => {
            const pos = geoToImagePercent(p.lat, p.lng);
            return (
              <div
                key={p.id}
                className="absolute cursor-pointer"
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => { e.stopPropagation(); setSelected(p); setSelectedType('participant'); }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ background: '#22c55e', border: '2px solid #86efac', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }}
                />
              </div>
            );
          })}
        </CampusMap>

        {/* Detail card */}
        {selected && (
          <div
            className="absolute left-4 bottom-4 z-20 rounded-lg shadow-xl max-w-xs"
            style={{ background: '#242019', border: '1px solid #3a3530', color: '#c4b99a' }}
          >
            <div className="flex items-start justify-between p-3 pb-0">
              <h3 className="font-bold text-sm" style={{ color: '#e8dcc8' }}>
                {'captain' in selected ? (selected as TeamMarker).name : (selected as ParticipantMarker).name}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-xs cursor-pointer ml-2 opacity-60 hover:opacity-100"
                style={{ color: '#c4b99a' }}
                aria-label="Close details"
              >
                x
              </button>
            </div>
            <div className="p-3 pt-2 text-xs space-y-2">
              {selectedType === 'team' && (() => {
                const t = selected as TeamMarker;
                return (
                  <>
                    {t.project_idea && <p style={{ color: '#8a8070' }}>{t.project_idea}</p>}
                    {t.needed_roles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {t.needed_roles.map((r) => (
                          <span key={r} className="rounded-full px-2 py-0.5 font-semibold" style={{ background: '#1e3a5f', color: '#93c5fd', fontSize: '10px' }}>{r}</span>
                        ))}
                      </div>
                    )}
                    <p style={{ color: '#5a5040', fontSize: '10px' }}>Captain: {t.captain.name}</p>
                  </>
                );
              })()}
              {selectedType === 'participant' && (() => {
                const p = selected as ParticipantMarker;
                return (
                  <>
                    {p.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.roles.map((r) => (
                          <span key={r} className="rounded-full px-2 py-0.5 font-semibold" style={{ background: '#14532d', color: '#86efac', fontSize: '10px' }}>{r}</span>
                        ))}
                      </div>
                    )}
                    {p.skills.length > 0 && <p style={{ color: '#8a8070' }}>{p.skills.join(', ')}</p>}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
