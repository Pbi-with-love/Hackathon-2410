import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

/* ── Types ── */

interface TeamInfo {
  id: string;
  name: string;
  captain_id: string;
  captain_name: string;
  captain_email: string;
  challenge: string | null;
  project_idea: string | null;
  goals: string | null;
  needed_roles: string[];
  status: 'open' | 'closed';
}

interface Member {
  id: string;
  name: string;
  email: string;
  roles: string[];
  skills: string[];
  status: string;
}

interface PendingMatch {
  id: string;
  participant_id: string;
  team_id: string;
  direction: 'team_to_participant' | 'participant_to_team';
  state: string;
  score: number;
  reasons: string[];
  participant_name: string;
  participant_roles: string[];
  team_name: string;
  team_project_idea: string | null;
  captain_id: string;
}

interface Suggestion {
  participantId: string;
  name: string;
  roles: string[];
  score: number;
  reasons: string[];
}

const MAX_TEAM_SIZE = 5;

/* ══════════════════════════════════════════════════════════════ */

export default function MyTeamPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  /* Edit form state */
  const [editName, setEditName] = useState('');
  const [editIdea, setEditIdea] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editChallenge, setEditChallenge] = useState('');
  const [editRoles, setEditRoles] = useState('');

  const isCaptain = team?.captain_id === user?.id;
  const isFull = members.length >= MAX_TEAM_SIZE;

  /* ── Data loading ── */

  const loadData = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // Get my team
      const teamRes = await apiFetch('/teams/mine');
      if (!teamRes.ok) throw new Error('Failed to load team');
      const teamData = (await teamRes.json()) as {
        team: TeamInfo | null;
        members: Member[];
        pendingCount: number;
      };

      setTeam(teamData.team);
      setMembers(teamData.members ?? []);

      // Load pending matches
      const matchRes = await apiFetch('/match');
      if (matchRes.ok) {
        const matchData = (await matchRes.json()) as PendingMatch[];
        setPendingMatches(matchData ?? []);
      }

      // If captain, load suggestions
      if (teamData.team && teamData.team.captain_id === user.id) {
        const sugRes = await apiFetch(`/match/participants/${teamData.team.id}`);
        if (sugRes.ok) {
          const sugData = (await sugRes.json()) as { suggestions: Suggestion[] };
          setSuggestions(sugData.suggestions ?? []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  /* ── Actions ── */

  const respondMatch = useCallback(async (matchId: string, action: 'accept' | 'decline') => {
    setActionLoading(matchId);
    try {
      const res = await apiFetch(`/match/${matchId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error);
      }
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }, [loadData]);

  const inviteParticipant = useCallback(async (participantId: string) => {
    setActionLoading(participantId);
    try {
      const res = await apiFetch('/match/invite', {
        method: 'POST',
        body: JSON.stringify({ participantId }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error);
      }
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setActionLoading(null);
    }
  }, [loadData]);

  const leaveTeam = useCallback(async () => {
    if (!team) return;
    setActionLoading('leave');
    try {
      const res = await apiFetch(`/teams/${team.id}/leave`, { method: 'POST' });
      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error);
      }
      setConfirmLeave(false);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave');
    } finally {
      setActionLoading(null);
    }
  }, [team, loadData]);

  const removeMember = useCallback(async (pid: string) => {
    if (!team) return;
    setActionLoading(pid);
    try {
      const res = await apiFetch(`/teams/${team.id}/members/${pid}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error);
      }
      setConfirmRemove(null);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setActionLoading(null);
    }
  }, [team, loadData]);

  const saveEdit = useCallback(async () => {
    if (!team) return;
    setActionLoading('save');
    try {
      const body: Record<string, unknown> = {};
      if (editName !== team.name) body.name = editName;
      if (editIdea !== (team.project_idea ?? '')) body.project_idea = editIdea;
      if (editGoals !== (team.goals ?? '')) body.goals = editGoals;
      if (editChallenge !== (team.challenge ?? '')) body.challenge = editChallenge;
      const roles = editRoles.split(',').map(r => r.trim()).filter(Boolean);
      body.needed_roles = roles;

      const res = await apiFetch(`/teams/${team.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error);
      }
      setEditMode(false);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setActionLoading(null);
    }
  }, [team, editName, editIdea, editGoals, editChallenge, editRoles, loadData]);

  const toggleStatus = useCallback(async () => {
    if (!team) return;
    setActionLoading('status');
    try {
      const newStatus = team.status === 'open' ? 'closed' : 'open';
      const res = await apiFetch(`/teams/${team.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionLoading(null);
    }
  }, [team, loadData]);

  const startEdit = useCallback(() => {
    if (!team) return;
    setEditName(team.name);
    setEditIdea(team.project_idea ?? '');
    setEditGoals(team.goals ?? '');
    setEditChallenge(team.challenge ?? '');
    setEditRoles(team.needed_roles.join(', '));
    setEditMode(true);
  }, [team]);

  /* ── Loading state ── */

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--muted)' }}>Loading...</span>
      </div>
    );
  }

  /* ── Error toast ── */
  const errorToast = error && (
    <div
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        background: 'var(--surface)', border: '1px solid var(--negative)',
        padding: '12px 20px', maxWidth: 360,
        fontFamily: 'var(--body)', fontSize: 13, color: 'var(--negative)',
      }}
    >
      {error}
      <button
        onClick={() => setError(null)}
        style={{ marginLeft: 12, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
      >
        Dismiss
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     STATE 1: No team
     ═══════════════════════════════════════════════════════════════ */
  if (!team) {
    const invitations = pendingMatches.filter(m => m.direction === 'team_to_participant' && m.state === 'invited');

    return (
      <div className="container" style={{ paddingTop: 'var(--sp-12)', paddingBottom: 'var(--sp-12)' }}>
        {errorToast}

        {/* Empty state */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-12)' }}>
          <h1 className="heading-display" style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)' }}>
            You're not in a team yet
          </h1>
          <p style={{ fontFamily: 'var(--body)', fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 'var(--sp-6)' }}>
            Find your perfect match or start your own team.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center' }}>
            <Link to="/match" className="btn primary" style={{ textDecoration: 'none', padding: '10px 24px', fontSize: 13 }}>
              Find my match
            </Link>
            <Link to="/team/new" className="btn" style={{ textDecoration: 'none', padding: '10px 24px', fontSize: 13 }}>
              Create a team
            </Link>
          </div>
        </div>

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 className="meta-label" style={{ marginBottom: 'var(--sp-4)' }}>
              {invitations.length} team{invitations.length !== 1 ? 's' : ''} invited you
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {invitations.map((inv) => (
                <div key={inv.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--body)', fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                      {inv.team_name}
                    </div>
                    {inv.team_project_idea && (
                      <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                        {inv.team_project_idea}
                      </div>
                    )}
                    {inv.reasons?.length > 0 && (
                      <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--accent)', fontStyle: 'italic' }}>
                        {inv.reasons[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn primary"
                      disabled={actionLoading === inv.id}
                      onClick={() => void respondMatch(inv.id, 'accept')}
                      style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                      Accept
                    </button>
                    <button
                      className="btn"
                      disabled={actionLoading === inv.id}
                      onClick={() => void respondMatch(inv.id, 'decline')}
                      style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        <div style={{ textAlign: 'center', marginTop: 'var(--sp-8)' }}>
          <Link
            to="/map/teams"
            style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}
          >
            Open the team map to browse recruiting teams
          </Link>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     STATE 2 & 3: Has a team (member or leader)
     ═══════════════════════════════════════════════════════════════ */

  const joinRequests = pendingMatches.filter(
    m => m.direction === 'participant_to_team' && m.state === 'requested' && m.team_id === team.id
  );

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-8)', paddingBottom: 'var(--sp-12)' }}>
      {errorToast}

      <div style={{ display: 'flex', gap: 'var(--sp-8)', alignItems: 'flex-start' }}>
        {/* ── Left: Team info ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
            {editMode ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="field-input"
                style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 0, maxWidth: 400 }}
              />
            ) : (
              <h1 className="heading-display" style={{ fontSize: 'var(--text-xl)', margin: 0 }}>
                {team.name}
              </h1>
            )}
            <span
              style={{
                fontFamily: 'var(--meta)', fontSize: 11, fontWeight: 500,
                padding: '3px 10px', letterSpacing: '0.06em', textTransform: 'uppercase',
                background: team.status === 'open' ? 'var(--accent)' : 'var(--raised)',
                color: team.status === 'open' ? 'var(--ink)' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {team.status}
            </span>
            {isCaptain && !editMode && (
              <button className="btn" onClick={startEdit} style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 14px' }}>
                Edit
              </button>
            )}
            {isCaptain && !editMode && (
              <button
                className="btn"
                onClick={() => void toggleStatus()}
                disabled={actionLoading === 'status'}
                style={{ fontSize: 12, padding: '6px 14px' }}
              >
                {team.status === 'open' ? 'Close recruiting' : 'Open recruiting'}
              </button>
            )}
          </div>

          {/* Challenge */}
          {editMode ? (
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <label className="field-label">Challenge</label>
              <input value={editChallenge} onChange={(e) => setEditChallenge(e.target.value)} className="field-input" style={{ marginBottom: 0 }} />
            </div>
          ) : team.challenge && (
            <div className="meta-label" style={{ marginBottom: 'var(--sp-4)', color: 'var(--accent)' }}>
              {team.challenge}
            </div>
          )}

          {/* About */}
          <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
            <div className="meta-label" style={{ marginBottom: 'var(--sp-2)' }}>About</div>
            {editMode ? (
              <>
                <textarea
                  value={editIdea}
                  onChange={(e) => setEditIdea(e.target.value)}
                  className="field-input"
                  rows={3}
                  placeholder="Project idea"
                  style={{ resize: 'none', marginBottom: 8 }}
                />
                <textarea
                  value={editGoals}
                  onChange={(e) => setEditGoals(e.target.value)}
                  className="field-input"
                  rows={2}
                  placeholder="Goals"
                  style={{ resize: 'none', marginBottom: 0 }}
                />
              </>
            ) : (
              <>
                {team.project_idea && (
                  <p style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.55, marginBottom: 8 }}>
                    {team.project_idea}
                  </p>
                )}
                {team.goals && (
                  <p style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                    {team.goals}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Needed roles */}
          <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
            <div className="meta-label" style={{ marginBottom: 'var(--sp-2)' }}>Still needed</div>
            {editMode ? (
              <input
                value={editRoles}
                onChange={(e) => setEditRoles(e.target.value)}
                className="field-input"
                placeholder="frontend developer, ml engineer, ux designer"
                style={{ marginBottom: 0 }}
              />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {team.needed_roles.map(r => (
                  <span key={r} className="skill-tag" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>{r}</span>
                ))}
                {team.needed_roles.length === 0 && (
                  <span style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>All roles filled</span>
                )}
              </div>
            )}
          </div>

          {/* Edit save/cancel */}
          {editMode && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--sp-6)' }}>
              <button className="btn primary" onClick={() => void saveEdit()} disabled={actionLoading === 'save'} style={{ fontSize: 12, padding: '8px 20px' }}>
                {actionLoading === 'save' ? 'Saving...' : 'Save changes'}
              </button>
              <button className="btn" onClick={() => setEditMode(false)} style={{ fontSize: 12, padding: '8px 20px' }}>
                Cancel
              </button>
            </div>
          )}

          {/* Members grid */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <div className="meta-label" style={{ marginBottom: 'var(--sp-3)' }}>
              Members ({members.length}/{MAX_TEAM_SIZE})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--sp-3)' }}>
              {members.map(m => (
                <div key={m.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--body)', fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                      {m.name}
                    </span>
                    {m.id === team.captain_id && (
                      <span className="meta-label" style={{ fontSize: 10 }}>Captain</span>
                    )}
                  </div>
                  {m.roles?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                      {m.roles.map(r => <span key={r} className="skill-tag">{r}</span>)}
                    </div>
                  )}
                  {m.skills?.length > 0 && (
                    <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--muted)' }}>
                      {m.skills.slice(0, 3).join(', ')}
                    </div>
                  )}
                  {/* Remove button (captain only, not self) */}
                  {isCaptain && m.id !== user?.id && (
                    <div style={{ marginTop: 8 }}>
                      {confirmRemove === m.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn"
                            onClick={() => void removeMember(m.id)}
                            disabled={actionLoading === m.id}
                            style={{ fontSize: 11, padding: '4px 10px', color: 'var(--negative)' }}
                          >
                            Confirm
                          </button>
                          <button className="btn" onClick={() => setConfirmRemove(null)} style={{ fontSize: 11, padding: '4px 10px' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn"
                          onClick={() => setConfirmRemove(m.id)}
                          style={{ fontSize: 11, padding: '4px 10px', color: 'var(--negative)' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: MAX_TEAM_SIZE - members.length }, (_, i) => (
                <div
                  key={`slot-${i}`}
                  style={{
                    border: '1px dashed var(--border)',
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--faint)',
                    fontFamily: 'var(--body)',
                    fontSize: 13,
                    minHeight: 80,
                    cursor: isCaptain ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (isCaptain) {
                      document.getElementById('recruiting-panel')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  + Open slot
                </div>
              ))}
            </div>
          </div>

          {/* Leave button */}
          {!isCaptain && (
            <div>
              {confirmLeave ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)' }}>Leave {team.name}?</span>
                  <button className="btn" onClick={() => void leaveTeam()} disabled={actionLoading === 'leave'} style={{ fontSize: 12, color: 'var(--negative)' }}>
                    Yes, leave
                  </button>
                  <button className="btn" onClick={() => setConfirmLeave(false)} style={{ fontSize: 12 }}>Cancel</button>
                </div>
              ) : (
                <button className="btn" onClick={() => setConfirmLeave(true)} style={{ fontSize: 12, color: 'var(--negative)' }}>
                  Leave team
                </button>
              )}
            </div>
          )}
          {isCaptain && members.length > 1 && (
            <div>
              {confirmLeave ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)' }}>
                    Leadership will transfer to {members.find(m => m.id !== user?.id)?.name}. Leave?
                  </span>
                  <button className="btn" onClick={() => void leaveTeam()} disabled={actionLoading === 'leave'} style={{ fontSize: 12, color: 'var(--negative)' }}>
                    Yes, leave
                  </button>
                  <button className="btn" onClick={() => setConfirmLeave(false)} style={{ fontSize: 12 }}>Cancel</button>
                </div>
              ) : (
                <button className="btn" onClick={() => setConfirmLeave(true)} style={{ fontSize: 12, color: 'var(--negative)' }}>
                  Leave team
                </button>
              )}
            </div>
          )}

          {/* Captain info */}
          <div style={{ marginTop: 'var(--sp-4)', fontFamily: 'var(--body)', fontSize: 12, color: 'var(--muted)' }}>
            Captain: {team.captain_name} ({team.captain_email})
          </div>
        </div>

        {/* ── Right: Recruiting panel (captain only) ── */}
        {isCaptain && (
          <div
            id="recruiting-panel"
            style={{
              width: 360,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-4)',
            }}
          >
            <h2 className="heading-body" style={{ fontSize: 'var(--text-base)', margin: 0 }}>Recruiting</h2>

            {isFull && (
              <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--accent)', padding: '8px 12px', background: 'var(--raised)', border: '1px solid var(--border)' }}>
                Team is full ({MAX_TEAM_SIZE}/{MAX_TEAM_SIZE}). Close recruiting to hide from the map.
              </div>
            )}

            {/* Join requests */}
            {joinRequests.length > 0 && (
              <div>
                <div className="meta-label" style={{ marginBottom: 'var(--sp-2)' }}>
                  Join requests ({joinRequests.length})
                </div>
                {joinRequests.map(req => (
                  <div key={req.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--body)', fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                      {req.participant_name}
                    </div>
                    {req.participant_roles?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                        {req.participant_roles.map(r => <span key={r} className="skill-tag">{r}</span>)}
                      </div>
                    )}
                    {req.reasons?.length > 0 && (
                      <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--accent)', fontStyle: 'italic', marginBottom: 8 }}>
                        {req.reasons[0]}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn primary"
                        disabled={actionLoading === req.id || isFull}
                        onClick={() => void respondMatch(req.id, 'accept')}
                        style={{ fontSize: 11, padding: '4px 12px' }}
                      >
                        Accept
                      </button>
                      <button
                        className="btn"
                        disabled={actionLoading === req.id}
                        onClick={() => void respondMatch(req.id, 'decline')}
                        style={{ fontSize: 11, padding: '4px 12px' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested candidates */}
            {suggestions.length > 0 && !isFull && (
              <div>
                <div className="meta-label" style={{ marginBottom: 'var(--sp-2)' }}>
                  Suggested candidates
                </div>
                {suggestions.slice(0, 3).map(s => (
                  <div key={s.participantId} className="card" style={{ padding: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--body)', fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        {s.name}
                      </span>
                      <span className="num" style={{ fontSize: 13, color: 'var(--accent)' }}>
                        {Math.round(s.score * 100)}%
                      </span>
                    </div>
                    {s.roles?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                        {s.roles.map(r => <span key={r} className="skill-tag">{r}</span>)}
                      </div>
                    )}
                    {s.reasons?.length > 0 && (
                      <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 8 }}>
                        {s.reasons[0]}
                      </div>
                    )}
                    <button
                      className="btn primary"
                      disabled={actionLoading === s.participantId}
                      onClick={() => void inviteParticipant(s.participantId)}
                      style={{ fontSize: 11, padding: '4px 12px', width: '100%' }}
                    >
                      {actionLoading === s.participantId ? 'Sending...' : 'Invite'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {joinRequests.length === 0 && suggestions.length === 0 && !isFull && (
              <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                No pending requests or suggestions yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
