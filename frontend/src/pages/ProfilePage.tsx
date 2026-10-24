import { useState, useEffect, useCallback } from 'react';
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

interface ParticipantProfile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string[];
  roles: string[];
  interests: string[];
  status: 'looking' | 'in_team';
  lat: number | null;
  lng: number | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<'looking' | 'in_team'>('looking');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/participants/${user.id}`);
      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error ?? 'Failed to load profile');
      }
      const data = (await res.json()) as { participant: ParticipantProfile };
      const p = data.participant;
      setProfile(p);
      setBio(p.bio ?? '');
      setSkillsInput(p.skills.join(', '));
      setInterestsInput(p.interests.join(', '));
      setSelectedRoles(p.roles);
      setStatus(p.status);
      setLat(p.lat);
      setLng(p.lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const interests = interestsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await apiFetch(`/participants/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ bio, skills, roles: selectedRoles, interests, status, lat, lng }),
      });

      if (!res.ok) {
        const d = (await res.json()) as { error: string };
        throw new Error(d.error ?? 'Failed to save profile');
      }

      setSuccessMsg('Profile saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error ?? 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
        {/* Basic info (read-only) */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <p className="text-sm text-gray-500">Name</p>
          <p className="font-medium text-gray-900">{profile.name}</p>
          <p className="text-sm text-gray-500 mt-2">Email</p>
          <p className="font-medium text-gray-900">{profile.email}</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. React, Python, Figma"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interests <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={interestsInput}
            onChange={(e) => setInterestsInput(e.target.value)}
            placeholder="e.g. AI, sustainability, fintech"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Roles */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Roles</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedRoles.includes(role)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'looking' | 'in_team')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="looking">Looking for a team</option>
            <option value="in_team">In a team</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Location</p>
          <LocationPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
        </div>

        {/* Feedback */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
