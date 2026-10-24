import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import LocationPicker from '../components/LocationPicker';

const ROLE_OPTIONS = [
  'Frontend Dev',
  'Backend Dev',
  'ML Engineer',
  'UX Designer',
  'Product Manager',
  'Data Scientist',
  'Mobile Dev',
  'DevOps',
];

interface Team {
  id: string;
  name: string;
  captain_id: string;
  captain_name: string | null;
  captain_email: string | null;
  challenge: string | null;
  project_idea: string | null;
  goals: string | null;
  needed_roles: string[];
  status: 'open' | 'closed';
  lat: number | null;
  lng: number | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
}

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isNew = id === 'new';

  // Create-team form state
  const [createName, setCreateName] = useState('');
  const [createProjectIdea, setCreateProjectIdea] = useState('');
  const [createGoals, setCreateGoals] = useState('');
  const [createNeededRoles, setCreateNeededRoles] = useState<string[]>([]);

  // Edit-team state
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [editName, setEditName] = useState('');
  const [editProjectIdea, setEditProjectIdea] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editNeededRoles, setEditNeededRoles] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'open' | 'closed'>('open');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    if (!id || isNew) return;
    setLoading(true);
    setError(null);
    try {
      const [teamRes, membersRes] = await Promise.all([
        apiFetch(`/teams/${id}`),
        apiFetch(`/teams/${id}/members`),
      ]);

      if (!teamRes.ok) {
        const d = (await teamRes.json()) as { error: string };
        throw new Error(d.error ?? 'Failed to load team');
      }

      const teamData = (await teamRes.json()) as { team: Team };
      const membersData = membersRes.ok
        ? ((await membersRes.json()) as { members: Member[] })
        : { members: [] };

      const t = teamData.team;
      setTeam(t);
      setEditName(t.name);
      setEditProjectIdea(t.project_idea ?? '');
      setEditGoals(t.goals ?? '');
      setEditNeededRoles(t.needed_roles);
      setEditStatus(t.status);
      setLat(t.lat);
      setLng(t.lng);
      setMembers(membersData.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  function toggleCreateRole(role: string) {
    setCreateNeededRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function toggleEditRole(role: string) {
    setEditNeededRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await apiFetch('/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: createName,
          project_idea: createProjectIdea,
          goals: createGoals,
          needed_roles: createNeededRoles,
        }),
      });

      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error ?? 'Failed to create team');
      }

      const data = (await res.json()) as { team: Team };
      navigate(`/team/${data.team.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch(`/teams/${team.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          project_idea: editProjectIdea,
          goals: editGoals,
          needed_roles: editNeededRoles,
          status: editStatus,
          lat,
          lng,
        }),
      });

      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error ?? 'Failed to update team');
      }

      const data = (await res.json()) as { team: Team };
      setTeam(data.team);
      setSuccessMsg('Team updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  // --- Create Team Form ---
  if (isNew) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--ground)' }}>
        {/* nav handled by shell */}
        <div className="max-w-2xl mx-auto w-full px-4 py-8">
          <div className="screen-title" style={{ marginBottom: 20 }}>CREATE TEAM</div>
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
            <div className="card" style={{ marginBottom: 0 }}>
              <label>
                <span className="field-label">TEAM NAME <span style={{ color: '#f87171' }}>*</span></span>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. The Innovators"
                  className="field-input"
                  style={{ marginBottom: 0 }}
                />
              </label>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <label>
                <span className="field-label">PROJECT IDEA</span>
                <textarea
                  rows={3}
                  value={createProjectIdea}
                  onChange={(e) => setCreateProjectIdea(e.target.value)}
                  placeholder="Describe your project idea..."
                  className="field-input"
                  style={{ resize: 'none', marginBottom: 0 }}
                />
              </label>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <label>
                <span className="field-label">GOALS</span>
                <textarea
                  rows={3}
                  value={createGoals}
                  onChange={(e) => setCreateGoals(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="field-input"
                  style={{ resize: 'none', marginBottom: 0 }}
                />
              </label>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <span className="field-label">NEEDED ROLES</span>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleCreateRole(role)}
                    className="pixel-btn cursor-pointer"
                    style={
                      createNeededRoles.includes(role)
                        ? { background: 'var(--primary)', color: 'var(--ink)', borderColor: 'var(--primary)' }
                        : {}
                    }
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#f87171' }}>{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="pixel-btn primary cursor-pointer"
              style={{ width: '100%', padding: '10px', fontSize: 12, opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'CREATING...' : 'CREATE TEAM'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Loading / Error states ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--ground)' }}>
        {/* nav handled by shell */}
        <div className="flex-1 flex items-center justify-center">
          <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--muted)' }}>Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--ground)' }}>
        {/* nav handled by shell */}
        <div className="flex-1 flex items-center justify-center">
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#f87171' }}>{error ?? 'Team not found'}</p>
        </div>
      </div>
    );
  }

  const isCaptain = user?.id === team.captain_id;

  // --- Team Detail View ---
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ground)' }}>
      {/* nav handled by shell */}

      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div className="screen-title" style={{ marginBottom: 0 }}>{team.name}</div>
          <span
            style={{
              fontFamily: 'var(--font)',
              fontSize: 12,
              padding: '4px 10px',
              background: team.status === 'open' ? 'var(--primary)' : 'var(--raised)',
              color: team.status === 'open' ? 'var(--ink)' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {team.status === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Team info (read-only when not captain) */}
        {!isCaptain && (
          <div className="card" style={{ marginBottom: 16 }}>
            {team.project_idea && (
              <div style={{ marginBottom: 12 }}>
                <span className="field-label">PROJECT IDEA</span>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)' }}>{team.project_idea}</p>
              </div>
            )}
            {team.goals && (
              <div style={{ marginBottom: 12 }}>
                <span className="field-label">GOALS</span>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)' }}>{team.goals}</p>
              </div>
            )}
            {team.needed_roles.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span className="field-label">NEEDED ROLES</span>
                <div className="flex flex-wrap gap-1.5">
                  {team.needed_roles.map((r) => (
                    <span key={r} className="skill-tag">{r}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="field-label">CAPTAIN</span>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)' }}>{team.captain_name ?? 'Unknown'}</p>
            </div>
          </div>
        )}

        {/* Edit form — captain only */}
        {isCaptain && (
          <form onSubmit={(e) => void handleUpdate(e)} className="space-y-4" style={{ marginBottom: 16 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <label>
                <span className="field-label">TEAM NAME</span>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="field-input"
                  style={{ marginBottom: 0 }}
                />
              </label>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <label>
                <span className="field-label">PROJECT IDEA</span>
                <textarea
                  rows={3}
                  value={editProjectIdea}
                  onChange={(e) => setEditProjectIdea(e.target.value)}
                  className="field-input"
                  style={{ resize: 'none', marginBottom: 0 }}
                />
              </label>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <label>
                <span className="field-label">GOALS</span>
                <textarea
                  rows={3}
                  value={editGoals}
                  onChange={(e) => setEditGoals(e.target.value)}
                  className="field-input"
                  style={{ resize: 'none', marginBottom: 0 }}
                />
              </label>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <span className="field-label">NEEDED ROLES</span>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleEditRole(role)}
                    className="pixel-btn cursor-pointer"
                    style={
                      editNeededRoles.includes(role)
                        ? { background: 'var(--primary)', color: 'var(--ink)', borderColor: 'var(--primary)' }
                        : {}
                    }
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Recruitment toggle */}
            <div className="card" style={{ marginBottom: 0 }}>
              <span className="field-label">RECRUITMENT STATUS</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditStatus('open')}
                  className="pixel-btn cursor-pointer"
                  style={editStatus === 'open' ? { background: 'var(--primary)', color: 'var(--ink)', borderColor: 'var(--primary)' } : {}}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setEditStatus('closed')}
                  className="pixel-btn cursor-pointer"
                  style={editStatus === 'closed' ? { background: 'var(--primary)', color: 'var(--ink)', borderColor: 'var(--primary)' } : {}}
                >
                  Closed
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="card" style={{ marginBottom: 0 }}>
              <span className="field-label">TEAM LOCATION</span>
              <LocationPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
            </div>

            {error && <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#f87171' }}>{error}</p>}
            {successMsg && <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#4ade80' }}>{successMsg}</p>}

            <button
              type="submit"
              disabled={saving}
              className="pixel-btn primary cursor-pointer"
              style={{ width: '100%', padding: '10px', fontSize: 12, opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </form>
        )}

        {/* Members list */}
        <div className="card">
          <span className="field-label">MEMBERS ({members.length})</span>
          {members.length === 0 ? (
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)' }}>No members yet.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 p-3"
                  style={{ background: 'var(--raised)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--active)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 14 }}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)' }}>
                      {m.name}
                      {m.id === team.captain_id && (
                        <span style={{ marginLeft: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--muted)' }}>(captain)</span>
                      )}
                    </p>
                    {m.roles.length > 0 && (
                      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{m.roles.join(', ')}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
