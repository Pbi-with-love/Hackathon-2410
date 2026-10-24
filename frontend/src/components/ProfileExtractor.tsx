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
    <div className="space-y-6">
      {/* Prompt input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your background
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Describe yourself in a few sentences, e.g. 'I'm a frontend dev with 3 years React experience, interested in sustainability tech, available all weekend'"
        />
      </div>

      {extractError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
          {extractError}
        </div>
      )}

      <button
        onClick={() => void handleExtract()}
        disabled={loading || prompt.trim().length < 10}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Extracting...' : 'Extract Profile'}
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 italic">
        AI-powered extraction (preview) — please review and edit before saving
      </p>

      {/* Extracted profile card */}
      {profile && (
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">Review your profile</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills{' '}
              <span className="text-gray-400 font-normal text-xs">(name:level, comma-separated — level 1–5)</span>
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {parseSkillsText(editSkillsText).map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                >
                  {s.name}
                  <span className="bg-blue-200 text-blue-800 rounded-full px-1 text-[10px] font-bold">
                    {s.level}
                  </span>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={editSkillsText}
              onChange={(e) => setEditSkillsText(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="JavaScript:3, React:4, Node.js:2"
            />
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ALL_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={editRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interests{' '}
              <span className="text-gray-400 font-normal text-xs">(comma-separated)</span>
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {parseInterestsText(editInterestsText).map((interest) => (
                <span
                  key={interest}
                  className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
            <input
              type="text"
              value={editInterestsText}
              onChange={(e) => setEditInterestsText(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="energy, sustainability, climate"
            />
          </div>

          {/* Feedback */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="p-3 bg-green-50 border border-green-300 text-green-700 rounded text-sm">
              Profile saved successfully!
            </div>
          )}

          <button
            onClick={() => void handleSave()}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
          >
            Save Profile
          </button>
        </div>
      )}
    </div>
  );
}
