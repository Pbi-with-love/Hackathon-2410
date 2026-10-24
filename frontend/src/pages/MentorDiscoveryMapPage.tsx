import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { geoToImagePercent, mentorStatusColor, mentorStatusLabel } from '../lib/mapConstants';
import CampusMap from '../components/CampusMap';
import HeroSection from '../components/HeroSection';

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  experience: string | null;
  status: 'available' | 'busy' | 'away';
  lat: number;
  lng: number;
}

export default function MentorDiscoveryMapPage() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [keyword, setKeyword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [myStatus, setMyStatus] = useState<Mentor['status']>('available');
  const [statusMsg, setStatusMsg] = useState('');
  const [selected, setSelected] = useState<Mentor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myMentor = user?.role === 'mentor' ? mentors.find((m) => m.id === user.id) : null;
  useEffect(() => {
    if (myMentor) setMyStatus(myMentor.status);
  }, [myMentor?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch('/map/mentors');
        if (res.ok) setMentors(((await res.json()) as { mentors: Mentor[] }).mentors);
      } catch { /* ignore */ }
    })();
  }, []);

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const qs = value.trim() ? `?expertise=${encodeURIComponent(value.trim())}` : '';
        const res = await apiFetch(`/mentors${qs}`);
        if (res.ok) setMentors(((await res.json()) as { mentors: Mentor[] }).mentors);
      } catch { /* ignore */ }
    }, 300);
  }, []);

  const handleUpdateLocation = useCallback(async () => {
    if (!user || user.role !== 'mentor' || !navigator.geolocation) return;
    setUpdating(true);
    setStatusMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await apiFetch(`/mentors/${user.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          if (res.ok) {
            setStatusMsg('Location updated!');
            const r2 = await apiFetch('/map/mentors');
            if (r2.ok) setMentors(((await r2.json()) as { mentors: Mentor[] }).mentors);
          } else setStatusMsg('Failed to update location.');
        } catch { setStatusMsg('Error updating location.'); }
        finally { setUpdating(false); }
      },
      () => { setStatusMsg('Could not get your location.'); setUpdating(false); },
    );
  }, [user]);

  const handleStatusChange = useCallback(async (newStatus: Mentor['status']) => {
    if (!user || user.role !== 'mentor') return;
    setMyStatus(newStatus);
    setStatusMsg('');
    try {
      const res = await apiFetch(`/mentors/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatusMsg('Status updated!');
        const r2 = await apiFetch('/map/mentors');
        if (r2.ok) setMentors(((await r2.json()) as { mentors: Mentor[] }).mentors);
      } else setStatusMsg('Failed to update status.');
    } catch { setStatusMsg('Error updating status.'); }
  }, [user]);

  const statusCounts = useMemo(() => {
    const c = { available: 0, busy: 0, away: 0 };
    mentors.forEach((m) => c[m.status]++);
    return c;
  }, [mentors]);

  return (
    <div className="flex flex-col h-screen" style={{ background: '#1a1814' }}>
      <HeroSection totalTeams={0} totalParticipants={0} totalMentors={mentors.length} />

      {/* Controls — dark themed */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: '#242019', borderBottom: '1px solid #3a3530' }}
      >
        <input
          type="text"
          placeholder="Filter by expertise..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="flex-1 min-w-[180px] max-w-xs px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
          style={{ background: '#1a1814', border: '1px solid #3a3530', color: '#c4b99a' }}
          aria-label="Filter mentors by expertise"
        />

        {user?.role === 'mentor' && (
          <>
            <button
              onClick={() => void handleUpdateLocation()}
              disabled={updating}
              className="px-4 py-1.5 text-sm rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              style={{ background: '#3a3530', color: '#c4b99a', border: '1px solid #5a5040' }}
            >
              {updating ? 'Updating...' : 'Update my location'}
            </button>
            <select
              value={myStatus}
              onChange={(e) => void handleStatusChange(e.target.value as Mentor['status'])}
              className="px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 cursor-pointer"
              style={{ background: '#1a1814', border: '1px solid #3a3530', color: '#c4b99a' }}
              aria-label="Set my availability status"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
            </select>
          </>
        )}

        {statusMsg && (
          <span className={`text-xs font-medium ${statusMsg.includes('!') ? 'text-green-400' : 'text-red-400'}`}>
            {statusMsg}
          </span>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-xs" style={{ color: '#8a8070' }}>
          {(['available', 'busy', 'away'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: mentorStatusColor(s) }} />
              {mentorStatusLabel(s)}
              {statusCounts[s] > 0 && (
                <span className="rounded-full px-1.5 font-semibold" style={{ background: '#2a2520', color: '#c4b99a' }}>
                  {statusCounts[s]}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <CampusMap>
          {mentors.map((mentor) => {
            const pos = geoToImagePercent(mentor.lat, mentor.lng);
            const color = mentorStatusColor(mentor.status);
            return (
              <div
                key={mentor.id}
                className="absolute cursor-pointer"
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => { e.stopPropagation(); setSelected(mentor); }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: color,
                    border: '2px solid rgba(255,255,255,0.7)',
                    boxShadow: `0 0 10px ${color}80`,
                  }}
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
              <h3 className="font-bold text-sm" style={{ color: '#e8dcc8' }}>{selected.name}</h3>
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
              <span
                className="inline-block rounded-full px-2 py-0.5 text-white font-semibold"
                style={{ background: mentorStatusColor(selected.status), fontSize: '10px' }}
              >
                {mentorStatusLabel(selected.status)}
              </span>
              {selected.expertise.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selected.expertise.map((e) => (
                    <span key={e} className="rounded-full px-2 py-0.5 font-semibold" style={{ background: '#2a2a4a', color: '#a5b4fc', fontSize: '10px' }}>{e}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#5a5040', fontStyle: 'italic' }}>No expertise listed</p>
              )}
              {selected.experience && <p style={{ color: '#8a8070', lineHeight: 1.4 }}>{selected.experience}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
