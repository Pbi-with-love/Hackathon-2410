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
    apiFetch(`/suggestions/teams/${user.id}`)
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
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: '20rem',
        zIndex: 1000,
        backgroundColor: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.9rem',
          backgroundColor: '#1e40af',
          color: '#fff',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Suggested for you</span>
        <span style={{ fontSize: '0.8rem' }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading && (
            <p style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
              Loading suggestions…
            </p>
          )}
          {error && (
            <p style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#dc2626' }}>
              {error}
            </p>
          )}
          {!loading && !error && suggestions.length === 0 && (
            <p style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
              No matching teams found yet.
            </p>
          )}
          {suggestions.map((s) => (
            <div
              key={s.teamId}
              style={{
                padding: '0.75rem 0.9rem',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                {s.teamName}
              </div>
              {s.projectIdea && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#6b7280',
                    marginTop: '0.2rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={s.projectIdea}
                >
                  {s.projectIdea}
                </div>
              )}
              {/* Matched roles as green tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                {s.neededRoles.map((role) => (
                  <span
                    key={role}
                    style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      fontWeight: 600,
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
              {/* Reasons */}
              {s.reasons.map((reason, i) => (
                <div
                  key={i}
                  style={{ fontSize: '0.75rem', color: '#374151', marginTop: '0.3rem' }}
                >
                  {reason}
                </div>
              ))}
              <button
                onClick={() => void handleRequestJoin(s.teamId)}
                style={{
                  marginTop: '0.55rem',
                  width: '100%',
                  padding: '0.35rem 0',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
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
