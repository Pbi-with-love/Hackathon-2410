import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  experience: string | null;
  status: 'available' | 'busy' | 'away';
  lat: number;
  lng: number;
}

const TAMPERE_CENTER: [number, number] = [61.4978, 23.761];
const DEFAULT_ZOOM = 15;

function statusColor(status: Mentor['status']): string {
  switch (status) {
    case 'available':
      return '#22c55e'; // green
    case 'busy':
      return '#eab308'; // yellow
    case 'away':
      return '#9ca3af'; // grey
  }
}

function makeDivIcon(status: Mentor['status']): L.DivIcon {
  const color = statusColor(status);
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;
      border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

export default function MentorDiscoveryMapPage() {
  const { user } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [keyword, setKeyword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [myStatus, setMyStatus] = useState<'available' | 'busy' | 'away'>('available');
  const [statusMsg, setStatusMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find my mentor record if current user is a mentor
  const myMentor = user?.role === 'mentor' ? mentors.find((m) => m.id === user.id) : null;

  // Sync myStatus from loaded mentor data
  useEffect(() => {
    if (myMentor) setMyStatus(myMentor.status);
  }, [myMentor?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load: GET /map/mentors (protected)
  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch('/map/mentors');
        if (res.ok) {
          const data = (await res.json()) as { mentors: Mentor[] };
          setMentors(data.mentors);
        }
      } catch (err) {
        console.error('Failed to load mentors', err);
      }
    })();
  }, []);

  // Initialise map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: TAMPERE_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers whenever mentors list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mentors.forEach((mentor) => {
      const marker = L.marker([mentor.lat, mentor.lng], {
        icon: makeDivIcon(mentor.status),
      });

      const expertiseTags = mentor.expertise
        .map((e) => `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;border-radius:4px;padding:1px 6px;margin:2px;font-size:12px">${e}</span>`)
        .join('');

      const statusBadgeColor =
        mentor.status === 'available'
          ? '#16a34a'
          : mentor.status === 'busy'
          ? '#ca8a04'
          : '#6b7280';

      marker.bindPopup(`
        <div style="min-width:180px">
          <strong style="font-size:14px">${mentor.name}</strong>
          <div style="margin:4px 0">${expertiseTags || '<em>No expertise listed</em>'}</div>
          ${mentor.experience ? `<div style="font-size:12px;color:#374151;margin-bottom:4px">${mentor.experience}</div>` : ''}
          <span style="display:inline-block;background:${statusBadgeColor};color:white;border-radius:4px;padding:1px 8px;font-size:12px;text-transform:capitalize">${mentor.status}</span>
        </div>
      `);

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [mentors]);

  // Debounced expertise filter — calls GET /mentors?expertise=<keyword>
  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const qs = value.trim() ? `?expertise=${encodeURIComponent(value.trim())}` : '';
        const res = await apiFetch(`/mentors${qs}`);
        if (res.ok) {
          const data = (await res.json()) as { mentors: Mentor[] };
          setMentors(data.mentors);
        }
      } catch (err) {
        console.error('Failed to filter mentors', err);
      }
    }, 300);
  }, []);

  // Update my location using geolocation
  const handleUpdateLocation = useCallback(async () => {
    if (!user || user.role !== 'mentor') return;
    if (!navigator.geolocation) {
      setStatusMsg('Geolocation not supported by your browser.');
      return;
    }
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
            // Refresh mentors
            const r2 = await apiFetch('/map/mentors');
            if (r2.ok) {
              const data = (await r2.json()) as { mentors: Mentor[] };
              setMentors(data.mentors);
            }
          } else {
            setStatusMsg('Failed to update location.');
          }
        } catch {
          setStatusMsg('Error updating location.');
        } finally {
          setUpdating(false);
        }
      },
      () => {
        setStatusMsg('Could not get your location.');
        setUpdating(false);
      }
    );
  }, [user]);

  // Update my status
  const handleStatusChange = useCallback(
    async (newStatus: 'available' | 'busy' | 'away') => {
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
          if (r2.ok) {
            const data = (await r2.json()) as { mentors: Mentor[] };
            setMentors(data.mentors);
          }
        } else {
          setStatusMsg('Failed to update status.');
        }
      } catch {
        setStatusMsg('Error updating status.');
      }
    },
    [user]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Nav bar */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', background: '#1e3a5f', color: 'white' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Mentor Map</span>
        <Link to="/map/teams" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>Team Map</Link>
        <Link to="/profile" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>Profile</Link>
      </nav>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <input
          type="text"
          placeholder="Filter by expertise..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          style={{ flex: '1 1 200px', maxWidth: 320, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
        />

        {/* Mentor-only controls */}
        {user?.role === 'mentor' && (
          <>
            <button
              onClick={() => void handleUpdateLocation()}
              disabled={updating}
              style={{ padding: '6px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
            >
              {updating ? 'Updating...' : 'Update my location'}
            </button>

            <select
              value={myStatus}
              onChange={(e) => void handleStatusChange(e.target.value as 'available' | 'busy' | 'away')}
              style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
            </select>
          </>
        )}

        {statusMsg && <span style={{ fontSize: 13, color: statusMsg.includes('!') ? '#16a34a' : '#dc2626' }}>{statusMsg}</span>}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', fontSize: 12, color: '#475569' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', marginRight: 4 }} />Available</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#eab308', marginRight: 4 }} />Busy</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#9ca3af', marginRight: 4 }} />Away</span>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} style={{ flex: 1 }} />
    </div>
  );
}
