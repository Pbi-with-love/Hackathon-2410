import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

interface Skill {
  name: string;
  level: number;
}

interface ParticipantProfile {
  name: string;
  bio: string;
  skills: Skill[];
  roles: string[];
  interests: string[];
  availability: { days: string[]; hours: string };
}

const ALL_ROLES = [
  'Frontend Dev',
  'Backend Dev',
  'ML Engineer',
  'UX Designer',
  'Product Manager',
  'Data Scientist',
  'Mobile Dev',
  'DevOps',
];

export default function ProfileExtractor() {
  const { user } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profile, setProfile] = useState<ParticipantProfile | null>(null);

  // Editable fields mirroring extracted profile
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkillsText, setEditSkillsText] = useState('');
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editInterestsText, setEditInterestsText] = useState('');

  function loadProfileIntoEditors(p: ParticipantProfile) {
    setProfile(p);
    setEditName(p.name);
    setEditBio(p.bio);
    setEditSkillsText(p.skills.map((s) => `${s.name}:${s.level}`).join(', '));
    setEditRoles(p.roles);
    setEditInterestsText(p.interests.join(', '));
    setSaveSuccess(false);
    setSaveError('');
  }

  async function handleExtract() {
    if (!prompt.trim()) return;
    setExtractError('');
    setLoading(true);
    try {
      const res = await apiFetch('/profile/extract', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        throw new Error(data.error ?? 'Extraction failed');
      }
      const data = (await res.json()) as { profile: ParticipantProfile };
      loadProfileIntoEditors(data.profile);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  }

  function parseSkillsText(text: string): Skill[] {
    return text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const [name, levelStr] = entry.split(':');
        const level = parseInt(levelStr ?? '3', 10);
        return { name: name?.trim() ?? entry, level: isNaN(level) ? 3 : Math.min(5, Math.max(1, level)) };
      });
  }

  function parseInterestsText(text: string): string[] {
    return text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function toggleRole(role: string) {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSave() {
    if (!user || !profile) return;
    setSaveError('');
    setSaveSuccess(false);

    const skills = parseSkillsText(editSkillsText);
    const interests = parseInterestsText(editInterestsText);

    try {
      const res = await apiFetch(`/participants/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          bio: editBio,
          skills: skills.map((s) => s.name),
          roles: editRoles,
          interests,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        throw new Error(data.error ?? 'Save failed');
      }
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <div className="space-y-4">
      {/* Prompt input */}
      <div>
        <span className="field-label">YOUR BACKGROUND</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="field-input"
          style={{ resize: 'none', marginBottom: 0 }}
          placeholder="Describe yourself in a few sentences, e.g. 'I'm a frontend dev with 3 years React experience, interested in sustainability tech, available all weekend'"
        />
      </div>

      {extractError && (
        <div style={{ background: 'var(--surface)', border: '1px solid #7a3a3a', color: '#f87171', fontFamily: 'var(--sans)', fontSize: 12, padding: '8px 12px' }}>
          {extractError}
        </div>
      )}

      <button
        onClick={() => void handleExtract()}
        disabled={loading || prompt.trim().length < 10}
        className="pixel-btn primary"
        style={{ padding: '10px 20px', fontSize: 12, opacity: loading || prompt.trim().length < 10 ? 0.5 : 1 }}
      >
        {loading ? 'Extracting...' : 'Extract Profile'}
      </button>

      {/* Disclaimer */}
      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
        AI-powered extraction (preview) — please review and edit before saving
      </p>

      {/* Extracted profile card */}
      {profile && (
        <div className="card space-y-4">
          <h2 style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)' }}>Review your profile</h2>

          {/* Name */}
          <div>
            <span className="field-label">NAME</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="field-input"
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Bio */}
          <div>
            <span className="field-label">BIO</span>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              className="field-input"
              style={{ resize: 'none', marginBottom: 0 }}
            />
          </div>

          {/* Skills */}
          <div>
            <span className="field-label">
              SKILLS{' '}
              <span style={{ color: 'var(--faint)', fontFamily: 'var(--font)', fontSize: 12 }}>(name:level, comma-separated -- level 1-5)</span>
            </span>
            <div className="mb-2 flex flex-wrap gap-2">
              {parseSkillsText(editSkillsText).map((s) => (
                <span
                  key={s.name}
                  className="skill-tag"
                >
                  {s.name}
                  <span style={{ marginLeft: 4, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 'bold' }}>
                    {s.level}
                  </span>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={editSkillsText}
              onChange={(e) => setEditSkillsText(e.target.value)}
              className="field-input"
              style={{ marginBottom: 0 }}
              placeholder="JavaScript:3, React:4, Node.js:2"
            />
          </div>

          {/* Roles */}
          <div>
            <span className="field-label">ROLES</span>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className="pixel-btn cursor-pointer"
                  style={
                    editRoles.includes(role)
                      ? { background: 'var(--primary)', color: 'var(--ink)', borderColor: 'var(--primary)' }
                      : {}
                  }
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <span className="field-label">
              INTERESTS{' '}
              <span style={{ color: 'var(--faint)', fontFamily: 'var(--font)', fontSize: 12 }}>(comma-separated)</span>
            </span>
            <div className="mb-2 flex flex-wrap gap-2">
              {parseInterestsText(editInterestsText).map((interest) => (
                <span
                  key={interest}
                  className="skill-tag"
                >
                  {interest}
                </span>
              ))}
            </div>
            <input
              type="text"
              value={editInterestsText}
              onChange={(e) => setEditInterestsText(e.target.value)}
              className="field-input"
              style={{ marginBottom: 0 }}
              placeholder="energy, sustainability, climate"
            />
          </div>

          {/* Feedback */}
          {saveError && (
            <div style={{ background: 'var(--surface)', border: '1px solid #7a3a3a', color: '#f87171', fontFamily: 'var(--sans)', fontSize: 12, padding: '8px 12px' }}>
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#4ade80', fontFamily: 'var(--sans)', fontSize: 12, padding: '8px 12px' }}>
              Profile saved successfully!
            </div>
          )}

          <button
            onClick={() => void handleSave()}
            className="pixel-btn primary"
            style={{ padding: '10px 20px', fontSize: 12 }}
          >
            Save Profile
          </button>
        </div>
      )}
    </div>
  );
}
