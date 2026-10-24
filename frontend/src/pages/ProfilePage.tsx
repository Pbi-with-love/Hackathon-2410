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
      <div className="flex-1 flex items-center justify-center">
        <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--muted)' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#f87171' }}>{error ?? 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <div style={{ marginBottom: 24 }}>
          <div className="screen-title">YOU</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)' }}>{profile.name} · {profile.email}</div>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          {/* Basic info (read-only) */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ marginBottom: 8 }}>
              <span className="field-label">NAME</span>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)' }}>{profile.name}</p>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span className="field-label">EMAIL</span>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)' }}>{profile.email}</p>
            </div>
            <div>
              <span className="field-label">STATUS</span>
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font)',
                  fontSize: 12,
                  padding: '3px 8px',
                  background: status === 'looking' ? 'var(--primary)' : 'var(--raised)',
                  color: status === 'looking' ? 'var(--ink)' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {status === 'looking' ? 'Looking for team' : 'In a team'}
              </span>
            </div>
          </div>

          {/* Bio */}
          <div className="card" style={{ marginBottom: 0 }}>
            <label>
              <span className="field-label">BIO</span>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="field-input"
                style={{ resize: 'none', marginBottom: 0 }}
              />
            </label>
          </div>

          {/* Skills */}
          <div className="card" style={{ marginBottom: 0 }}>
            <label>
              <span className="field-label">SKILLS <span style={{ color: 'var(--muted)', fontFamily: 'var(--font)', fontSize: 12 }}>(comma-separated)</span></span>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. React, Python, Figma"
                className="field-input"
                style={{ marginBottom: skillsInput.trim() ? 8 : 0 }}
              />
            </label>
            {skillsInput.trim() && (
              <div className="flex flex-wrap gap-1.5">
                {skillsInput.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="card" style={{ marginBottom: 0 }}>
            <label>
              <span className="field-label">INTERESTS <span style={{ color: 'var(--muted)', fontFamily: 'var(--font)', fontSize: 12 }}>(comma-separated)</span></span>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g. AI, sustainability, fintech"
                className="field-input"
                style={{ marginBottom: interestsInput.trim() ? 8 : 0 }}
              />
            </label>
            {interestsInput.trim() && (
              <div className="flex flex-wrap gap-1.5">
                {interestsInput.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Roles */}
          <div className="card" style={{ marginBottom: 0 }}>
            <span className="field-label">ROLES</span>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className="pixel-btn cursor-pointer"
                  style={
                    selectedRoles.includes(role)
                      ? { background: 'var(--primary)', color: 'var(--ink)', borderColor: 'var(--primary)' }
                      : {}
                  }
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="card" style={{ marginBottom: 0 }}>
            <label>
              <span className="field-label">STATUS</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'looking' | 'in_team')}
                className="field-input"
                style={{ cursor: 'pointer', marginBottom: 0 }}
              >
                <option value="looking">Looking for a team</option>
                <option value="in_team">In a team</option>
              </select>
            </label>
          </div>

          {/* Location */}
          <div className="card" style={{ marginBottom: 0 }}>
            <span className="field-label">LOCATION</span>
            <LocationPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
          </div>

          {/* Feedback */}
          {error && (
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#f87171' }}>{error}</p>
          )}
          {successMsg && (
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#4ade80' }}>{successMsg}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="pixel-btn primary cursor-pointer"
            style={{ width: '100%', padding: '10px', fontSize: 12, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </form>
      </div>
  );
}
