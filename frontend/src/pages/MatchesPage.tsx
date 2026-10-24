import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.ts';

interface Match {
  id: string;
  state: string;
  direction: string;
  team_name: string;
  team_project_idea: string | null;
  participant_name: string;
  participant_roles: string[];
  captain_id: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiFetch('/match');
      const data = (await res.json()) as Match[];
      setMatches(data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const respond = async (matchId: string, action: 'accept' | 'decline') => {
    await apiFetch(`/match/${matchId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    void load();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--muted)' }}>No pending invitations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <div className="screen-title" style={{ marginBottom: 20 }}>INVITATIONS</div>

      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <div key={m.id} className="card">
            <div className="flex justify-between items-start" style={{ marginBottom: 8 }}>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{m.team_name}</p>
                {m.team_project_idea && (
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{m.team_project_idea}</p>
                )}
                <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--muted)' }}>
                  {m.direction === 'team_to_participant' ? 'Team invited you' : 'You requested to join'}
                </p>
              </div>
              <span
                style={{
                  marginLeft: 12,
                  fontFamily: 'var(--font)',
                  fontSize: 12,
                  padding: '3px 8px',
                  background: m.state === 'invited' ? 'var(--active)' : 'var(--raised)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                {m.state}
              </span>
            </div>

            {m.participant_roles?.length > 0 && (
              <div className="flex flex-wrap gap-1" style={{ marginBottom: 12 }}>
                {m.participant_roles.map((r) => (
                  <span key={r} className="skill-tag">{r}</span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => void respond(m.id, 'accept')}
                className="pixel-btn primary cursor-pointer"
                style={{ padding: '6px 16px', fontSize: 12 }}
              >
                Accept
              </button>
              <button
                onClick={() => void respond(m.id, 'decline')}
                className="pixel-btn cursor-pointer"
                style={{ padding: '6px 16px', fontSize: 12 }}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
