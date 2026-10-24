import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

interface TeamSuggestion {
  teamId: string;
  teamName: string;
  projectIdea: string;
  neededRoles: string[];
  score: number;
  reasons: string[];
  lat: number | null;
  lng: number | null;
}

export default function SuggestedTeams() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<TeamSuggestion[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/match/teams/${user.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error ?? 'Failed to load suggestions');
        }
        return res.json() as Promise<{ suggestions: TeamSuggestion[] }>;
      })
      .then((data) => setSuggestions(data.suggestions))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleRequestJoin = async (teamId: string) => {
    try {
      const res = await apiFetch('/match/request', {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error: string };
        alert(body.error ?? 'Request failed');
      } else {
        alert('Request sent!');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <div
      className="absolute top-4 right-4 w-80 z-[1000] overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        style={{ background: 'var(--raised)', borderBottom: '1px solid var(--border)' }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--primary)' }}>Suggested for you</span>
        <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--muted)' }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="max-h-[70vh] overflow-y-auto">
          {loading && (
            <p style={{ padding: 12, fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)' }}>
              Loading suggestions...
            </p>
          )}
          {error && (
            <p style={{ padding: 12, fontFamily: 'var(--sans)', fontSize: 12, color: '#f87171' }}>
              {error}
            </p>
          )}
          {!loading && !error && suggestions.length === 0 && (
            <p style={{ padding: 12, fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)' }}>
              No matching teams found yet.
            </p>
          )}
          {suggestions.map((s) => (
            <div
              key={s.teamId}
              style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                {s.teamName}
              </div>
              {s.projectIdea && (
                <div
                  style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={s.projectIdea}
                >
                  {s.projectIdea}
                </div>
              )}
              {/* Matched roles as skill tags */}
              <div className="flex flex-wrap gap-1" style={{ marginBottom: 6 }}>
                {s.neededRoles.map((role) => (
                  <span key={role} className="skill-tag">{role}</span>
                ))}
              </div>
              {/* Reasons */}
              {s.reasons.map((reason, i) => (
                <div
                  key={i}
                  style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--primary)', marginBottom: 2 }}
                >
                  {reason}
                </div>
              ))}
              <button
                onClick={() => void handleRequestJoin(s.teamId)}
                className="pixel-btn primary"
                style={{ marginTop: 8, width: '100%', padding: '6px', fontSize: 12 }}
              >
                Request to Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
