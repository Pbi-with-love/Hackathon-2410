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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Team</h1>
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. The Innovators"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Idea</label>
            <textarea
              rows={3}
              value={createProjectIdea}
              onChange={(e) => setCreateProjectIdea(e.target.value)}
              placeholder="Describe your project idea…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goals</label>
            <textarea
              rows={3}
              value={createGoals}
              onChange={(e) => setCreateGoals(e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Needed Roles</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleCreateRole(role)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    createNeededRoles.includes(role)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Team'}
          </button>
        </form>
      </div>
    );
  }

  // --- Loading / Error states ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading team…</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error ?? 'Team not found'}</p>
      </div>
    );
  }

  const isCaptain = user?.id === team.captain_id;

  // --- Team Detail View ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            team.status === 'open'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {team.status === 'open' ? 'Open for recruitment' : 'Closed'}
        </span>
      </div>

      {/* Team info (read-only when not captain) */}
      {!isCaptain && (
        <div className="space-y-4 mb-8">
          {team.project_idea && (
            <div>
              <p className="text-sm font-medium text-gray-500">Project Idea</p>
              <p className="text-gray-900">{team.project_idea}</p>
            </div>
          )}
          {team.goals && (
            <div>
              <p className="text-sm font-medium text-gray-500">Goals</p>
              <p className="text-gray-900">{team.goals}</p>
            </div>
          )}
          {team.needed_roles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Needed Roles</p>
              <div className="flex flex-wrap gap-2">
                {team.needed_roles.map((r) => (
                  <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500">Captain</p>
            <p className="text-gray-900">{team.captain_name ?? 'Unknown'}</p>
          </div>
        </div>
      )}

      {/* Edit form — captain only */}
      {isCaptain && (
        <form onSubmit={(e) => void handleUpdate(e)} className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Idea</label>
            <textarea
              rows={3}
              value={editProjectIdea}
              onChange={(e) => setEditProjectIdea(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goals</label>
            <textarea
              rows={3}
              value={editGoals}
              onChange={(e) => setEditGoals(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Needed Roles</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleEditRole(role)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    editNeededRoles.includes(role)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Recruitment toggle */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Recruitment Status</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditStatus('open')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  editStatus === 'open'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setEditStatus('closed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  editStatus === 'closed'
                    ? 'bg-gray-600 text-white border-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                Closed
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Team Location</p>
            <LocationPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Members list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Members ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-gray-500 text-sm">No members yet.</p>
        ) : (
          <ul className="space-y-3">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {m.name}
                    {m.id === team.captain_id && (
                      <span className="ml-1 text-xs text-blue-600">(captain)</span>
                    )}
                  </p>
                  {m.roles.length > 0 && (
                    <p className="text-xs text-gray-500">{m.roles.join(', ')}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
