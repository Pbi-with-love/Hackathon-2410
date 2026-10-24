import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { mentorStatusColor, mentorStatusLabel } from '../lib/mapConstants';
import CanvasMap, { type MapMarker } from '../components/CanvasMap';

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  experience: string | null;
  status: 'available' | 'busy' | 'away';
  lat: number;
  lng: number;
}

type StatusFilter = 'all' | 'available' | 'busy' | 'away';

const STATUSES: Mentor['status'][] = ['available', 'busy', 'away'];

export default function MentorDiscoveryMapPage() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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

  const filteredMentors = useMemo(() => {
    if (statusFilter === 'all') return mentors;
    return mentors.filter((m) => m.status === statusFilter);
  }, [mentors, statusFilter]);

  const statusCounts = useMemo(() => {
    const c = { available: 0, busy: 0, away: 0 };
    mentors.forEach((m) => c[m.status]++);
    return c;
  }, [mentors]);

  const mentorMarkers: MapMarker[] = useMemo(() =>
    filteredMentors.map(m => ({
      id: m.id,
      name: m.name,
      lat: m.lat,
      lng: m.lng,
      role: 'Mentor',
      type: 'mentor' as const,
      status: m.status,
    })),
    [filteredMentors]
  );

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const mentor = filteredMentors.find(m => m.id === marker.id);
    if (mentor) setSelected(mentor);
  }, [filteredMentors]);

  const handleListClick = useCallback((mentor: Mentor) => {
    setSelected(mentor);
  }, []);

  const isSelf = selected && user?.role === 'mentor' && selected.id === user.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <input
          type="text"
          placeholder="Describe your problem..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-1.5"
          style={{
            background: 'var(--raised)',
            border: '1px solid var(--border)',
            borderRadius: 0,
            color: 'var(--text)',
            fontFamily: 'var(--sans)',
            fontSize: 14,
            outline: 'none',
          }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          aria-label="Describe your problem to find mentors"
        />

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5">
          {(['all', ...STATUSES] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="cursor-pointer"
              style={{
                background: statusFilter === s ? 'var(--active)' : 'var(--raised)',
                border: statusFilter === s ? '1px solid var(--primary)' : '1px solid var(--border)',
                color: statusFilter === s ? 'var(--primary)' : 'var(--muted)',
                fontFamily: 'var(--meta)',
                fontSize: 12,
                fontWeight: 500,
                padding: '5px 8px',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {s !== 'all' && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: mentorStatusColor(s as Mentor['status']),
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
              )}
              {s === 'all' ? 'All' : mentorStatusLabel(s as Mentor['status'])}
            </button>
          ))}
        </div>

        {/* Legend with counts */}
        <div className="flex items-center gap-3 ml-auto" style={{ fontFamily: 'var(--meta)', fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>
          {STATUSES.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5" style={{ background: mentorStatusColor(s) }} />
              {mentorStatusLabel(s)}
              <span style={{ color: 'var(--text)' }}>{statusCounts[s]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Three-panel body */}
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        {/* Left list panel */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            width: 320,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg)',
          }}
        >
          <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ fontFamily: 'var(--meta)', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, color: 'var(--text)' }}>
              {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--active) var(--bg)' }}>
            {filteredMentors.map((m) => {
              const isActive = selected?.id === m.id;
              const visibleExpertise = m.expertise.slice(0, 3);
              const extraCount = m.expertise.length - 3;
              return (
                <button
                  key={m.id}
                  onClick={() => handleListClick(m)}
                  className="w-full text-left cursor-pointer"
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    background: isActive ? 'var(--raised)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderRadius: 0,
                    outline: 'none',
                  }}
                >
                  <div style={{ fontFamily: 'var(--body)', fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                    {m.name}
                  </div>
                  {m.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1" style={{ marginBottom: 6 }}>
                      {visibleExpertise.map((e) => (
                        <span
                          key={e}
                          style={{
                            background: 'var(--active)',
                            border: '1px solid var(--border)',
                            fontFamily: 'var(--meta)',
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                            padding: '1px 5px',
                            color: 'var(--muted)',
                          }}
                        >
                          {e}
                        </span>
                      ))}
                      {extraCount > 0 && (
                        <span
                          style={{
                            fontFamily: 'var(--meta)',
                            fontSize: 11,
                            color: 'var(--muted)',
                            padding: '1px 4px',
                          }}
                        >
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: mentorStatusColor(m.status),
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontFamily: 'var(--meta)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--muted)' }}>
                      {mentorStatusLabel(m.status)}
                    </span>
                  </div>
                  {m.experience && (
                    <div
                      style={{
                        fontFamily: 'var(--body)',
                        fontSize: 12,
                        color: 'var(--muted)',
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.experience}
                    </div>
                  )}
                </button>
              );
            })}
            {filteredMentors.length === 0 && (
              <div className="p-4" style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)' }}>
                No mentors match your filters.
              </div>
            )}
          </div>
        </div>

        {/* Center map panel */}
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          <CanvasMap
            markers={mentorMarkers}
            onMarkerClick={handleMarkerClick}
            selectedId={selected?.id ?? null}
          />
        </div>

        {/* Right detail drawer */}
        {selected && (
          <div
            className="flex-shrink-0 flex flex-col overflow-y-auto"
            style={{
              width: 360,
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--active) var(--surface)',
            }}
          >
            {/* Close button */}
            <div className="flex justify-end p-3 pb-0">
              <button
                onClick={() => setSelected(null)}
                className="btn cursor-pointer"
                style={{ padding: '4px 12px', fontSize: 13 }}
                aria-label="Close details"
              >
                x
              </button>
            </div>

            <div className="p-4 pt-2 flex flex-col gap-4">
              {/* Name */}
              <h3 style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', margin: 0 }}>
                {selected.name}
              </h3>

              {/* Status badge */}
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: mentorStatusColor(selected.status),
                    fontFamily: 'var(--font)',
                    fontSize: 12,
                    color: 'var(--ink)',
                    padding: '3px 8px',
                  }}
                >
                  {mentorStatusLabel(selected.status)}
                </span>
              </div>

              {/* Expertise tags */}
              {selected.expertise.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selected.expertise.map((e) => (
                    <span key={e} className="skill-tag">{e}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                  No expertise listed
                </p>
              )}

              {/* Experience */}
              {selected.experience && (
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                  {selected.experience}
                </p>
              )}

              {/* Best for line */}
              {selected.expertise.length > 0 && (
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--primary)', margin: 0 }}>
                  Best for: {selected.expertise.join(', ').toLowerCase()} problems
                </p>
              )}

              {/* Self-management controls for mentor viewing themselves */}
              {isSelf && (
                <div
                  className="flex flex-col gap-3"
                  style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}
                >
                  <label style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--primary)', display: 'block' }}>
                    My status
                  </label>
                  <select
                    value={myStatus}
                    onChange={(e) => void handleStatusChange(e.target.value as Mentor['status'])}
                    className="cursor-pointer"
                    style={{
                      width: '100%',
                      background: 'var(--raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 0,
                      color: 'var(--text)',
                      fontFamily: 'var(--sans)',
                      fontSize: 13,
                      padding: '8px 10px',
                      outline: 'none',
                    }}
                    aria-label="Set my availability status"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="away">Away</option>
                  </select>
                  <button
                    onClick={() => void handleUpdateLocation()}
                    disabled={updating}
                    className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{ padding: '8px 10px' }}
                  >
                    {updating ? 'Updating...' : 'Update my location'}
                  </button>
                  {statusMsg && (
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: statusMsg.includes('!') ? '#4ade80' : '#f87171' }}>
                      {statusMsg}
                    </span>
                  )}
                </div>
              )}

              {/* Ask for help button */}
              {!isSelf && (
                <button
                  onClick={() => alert(`Help request sent to ${selected.name}!`)}
                  className="btn primary w-full cursor-pointer"
                  style={{ padding: '12px 16px', fontSize: 13, marginTop: 8 }}
                >
                  Ask for help
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
