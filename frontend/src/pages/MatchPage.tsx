import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: number;
  role: 'ai' | 'user';
  text: string;
  chips?: ProfileChips;
  showMatchButton?: boolean;
}

interface ProfileChips {
  idea: string;
  skills: string[];
  role: string;
  interests: string[];
}

interface TeamCard {
  id: string;
  name: string;
  fit: number;
  challenge: string;
  needed_roles: string[];
  reason: string;
  members: number;
  max_size: number;
  zone: string | null;
  factors: { interest: number; role: number; avail: number };
  matched_role: string | null;
}

interface ApiProfile {
  idea: string | null;
  interests: string[];
  skills: string[];
  roles: string[];
  availability: string | null;
  synonyms: string[];
}

interface MatchResponse {
  profile: ApiProfile;
  results: TeamCard[];
  meta: { candidates: number; weights: Record<string, number>; ms: number; fallback: boolean };
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d="M8 1v10M4 5l4-4 4 4M2 11v2a2 2 0 002 2h8a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton placeholder for empty state                               */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div
      style={{
        width: '100%',
        background: 'var(--raised)',
        opacity: 0.4,
        height: 120,
        marginBottom: 12,
        border: '1px solid var(--border)',
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const SUGGESTED_PROMPTS = [
  "I'm a frontend dev looking for a sustainability project",
  'I want to build an AI-powered education tool',
  'I have experience in ML and want to join a health-tech team',
];


/* ------------------------------------------------------------------ */
/*  Editable Chip                                                      */
/* ------------------------------------------------------------------ */

function EditableChip({ value, onRemove, onChange }: { value: string; onRemove: () => void; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'var(--active)',
          border: '1px solid var(--accent)',
          padding: '2px 6px',
          fontFamily: 'var(--meta)',
          fontSize: 13,
          color: 'var(--text)',
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim()) onChange(draft.trim());
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (draft.trim()) onChange(draft.trim());
              setEditing(false);
            }
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontFamily: 'var(--meta)',
            fontSize: 13,
            width: Math.max(40, draft.length * 8),
            padding: 0,
          }}
        />
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'var(--active)',
        border: '1px solid var(--border)',
        padding: '2px 8px',
        fontFamily: 'var(--meta)',
        fontSize: 13,
        color: 'var(--text)',
        cursor: 'pointer',
      }}
      onClick={() => setEditing(true)}
    >
      {value}
      <span
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          marginLeft: 2,
          color: 'var(--muted)',
          cursor: 'pointer',
          fontFamily: 'var(--meta)',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        x
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function MatchPage() {
  /* ---- Import bar ---- */
  const [importOpen, setImportOpen] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [challengeRole, setChallengeRole] = useState('');

  /* ---- Chat ---- */
  const initialMessages: ChatMessage[] = [
    {
      id: 1,
      role: 'ai',
      text: 'Hi! Tell me your idea, the skills you bring, and the role you want to play.',
    },
  ];
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [hasMatched, setHasMatched] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ---- Results ---- */
  const [activeTab, setActiveTab] = useState<'teams' | 'people'>('teams');
  const [sortMode, setSortMode] = useState<'best' | 'all'>('best');
  const [visibleTeams, setVisibleTeams] = useState(5);
  const [joinedTeams, setJoinedTeams] = useState<Set<string>>(new Set());
  const [skippedTeams, setSkippedTeams] = useState<Set<string>>(new Set());
  const [teamResults, setTeamResults] = useState<TeamCard[]>([]);
  const [allTeams, setAllTeams] = useState<TeamCard[]>([]);
  const [apiProfile, setApiProfile] = useState<ApiProfile | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number> | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  /* Fetch all teams on mount for "All teams" mode */
  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch('/map/teams');
        if (!res.ok) return;
        const data = (await res.json()) as { teams: Array<{ id: string; name: string; project_idea: string | null; needed_roles: string[]; lat: number; lng: number; captain: { id: string; name: string } }> };
        setAllTeams(data.teams.map(t => ({
          id: t.id,
          name: t.name,
          fit: 0,
          challenge: '',
          needed_roles: t.needed_roles,
          reason: t.project_idea || '',
          members: 0,
          max_size: 5,
          zone: null,
          factors: { interest: 0, role: 0, avail: 0 },
          matched_role: null,
        })));
      } catch { /* ignore */ }
    })();
  }, []);

  /* auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const nextId = () => Math.max(0, ...messages.map((m) => m.id)) + 1;

  /* Call the real API */
  const callMatchApi = useCallback(async (prompt: string, profile: ApiProfile | null, extras?: { exclude_ids?: string[]; weights?: Record<string, number> }) => {
    setMatchLoading(true);
    try {
      const res = await apiFetch('/api/match', {
        method: 'POST',
        body: JSON.stringify({
          prompt: profile ? '' : prompt,
          profile,
          target: 'teams',
          exclude_ids: extras?.exclude_ids || excludeIds,
          feedback: { weights: extras?.weights || weights, declined: [] },
          limit: 5,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error || 'Match failed');
      }

      const data = (await res.json()) as MatchResponse;
      setApiProfile(data.profile);
      setTeamResults((prev) => [...prev, ...data.results]);
      setIsFallback(data.meta.fallback);
      if (data.meta.weights) setWeights(data.meta.weights);

      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[match]', msg);
      // Show error in chat
      setMessages((prev) => [...prev, {
        id: Date.now(),
        role: 'ai' as const,
        text: `Matching failed: ${msg}. Please try again.`,
      }]);
      return null;
    } finally {
      setMatchLoading(false);
    }
  }, [excludeIds, weights]);

  function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');

    // Clear previous results for a fresh search
    setTeamResults([]);
    setExcludeIds([]);
    setSkippedTeams(new Set());
    setJoinedTeams(new Set());
    setHasMatched(false);
    setIsFallback(false);

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: msg };
    const loadingMsg: ChatMessage = { id: nextId() + 1, role: 'ai', text: 'Analyzing your profile...' };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    // Call API
    void callMatchApi(msg, null).then((data) => {
      if (data) {
        const profile = data.profile;
        const aiReply: ChatMessage = {
          id: nextId() + 2,
          role: 'ai',
          text: "Here's what I picked up:",
          chips: {
            idea: profile.idea || '',
            skills: profile.skills || [],
            role: profile.roles?.[0] || '',
            interests: profile.interests || [],
          },
          showMatchButton: true,
        };
        // Replace loading message with real reply
        setMessages((prev) => [...prev.filter((m) => m.text !== 'Analyzing your profile...'), aiReply]);
        setHasMatched(true);
      } else {
        setMessages((prev) => [...prev.filter((m) => m.text !== 'Analyzing your profile...'), {
          id: nextId() + 2,
          role: 'ai' as const,
          text: 'Sorry, matching failed. Try again or browse the team map.',
        }]);
      }
    });
  }

  function handleMatch() {
    // Re-match with edited chips (profile already set from first call)
    const lastChips = messages.findLast((m) => m.chips)?.chips;
    if (lastChips && apiProfile) {
      const editedProfile: ApiProfile = {
        ...apiProfile,
        idea: lastChips.idea || apiProfile.idea,
        skills: lastChips.skills.length > 0 ? lastChips.skills : apiProfile.skills,
        roles: lastChips.role ? [lastChips.role, ...(apiProfile.roles?.slice(1) || [])] : apiProfile.roles,
        interests: lastChips.interests.length > 0 ? lastChips.interests : apiProfile.interests,
      };
      setTeamResults([]);
      void callMatchApi('', editedProfile).then((data) => {
        if (data) {
          setHasMatched(true);
          const confirmMsg: ChatMessage = {
            id: nextId(),
            role: 'ai',
            text: data.meta.fallback
              ? 'Showing keyword-based results (AI matching is warming up).'
              : `Found ${data.results.length} teams from ${data.meta.candidates} candidates in ${(data.meta.ms / 1000).toFixed(1)}s.`,
          };
          setMessages((prev) => [...prev, confirmMsg]);
        }
      });
    } else {
      setHasMatched(true);
    }
  }

  function handleChipChange(msgId: number, field: keyof ProfileChips, index: number | null, value: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.chips) return m;
        const chips = { ...m.chips };
        if (field === 'idea' || field === 'role') {
          chips[field] = value;
        } else {
          const arr = [...chips[field]];
          if (index !== null) arr[index] = value;
          chips[field] = arr;
        }
        return { ...m, chips };
      }),
    );
  }

  function handleChipRemove(msgId: number, field: keyof ProfileChips, index: number | null) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.chips) return m;
        const chips = { ...m.chips };
        if (field === 'idea' || field === 'role') {
          chips[field] = '';
        } else {
          chips[field] = chips[field].filter((_, i) => i !== index);
        }
        return { ...m, chips };
      }),
    );
  }

  function handleJoin(teamId: string) {
    setJoinedTeams((prev) => new Set(prev).add(teamId));
    // Actually send the join request
    void apiFetch('/match/request', {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  function handleSkip(teamId: string) {
    setSkippedTeams((prev) => new Set(prev).add(teamId));
    setExcludeIds((prev) => [...prev, teamId]);
  }

  function handleShowMore() {
    const currentIds = teamResults.map((t) => t.id);
    void callMatchApi('', apiProfile, { exclude_ids: currentIds });
  }

  const displayTeams = sortMode === 'all' ? allTeams : teamResults;
  const filteredTeams = displayTeams.filter((t) => !skippedTeams.has(t.id));

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ground)' }}>
      {/* ============ IMPORT BAR ============ */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        {/* Toggle row */}
        <button
          onClick={() => setImportOpen(!importOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 24px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: importOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M3 1l4 4-4 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: 'var(--meta)', fontSize: 12, color: 'var(--accent)', letterSpacing: '0.04em' }}>
            IMPORT CV / PROFILE
          </span>
          {!importOpen && (
            <span style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--faint)', marginLeft: 4 }}>
              Upload a resume or paste a link to auto-fill your profile
            </span>
          )}
        </button>

        {/* Expanded import form */}
        {importOpen && (
          <div style={{ padding: '0 24px 20px' }}>
            {/* Row 1: CV drop + URL inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* CV drop zone */}
              <div>
                <span className="field-label">Resume / CV</span>
                <div
                  style={{
                    border: '1px dashed var(--control-border)',
                    background: 'var(--raised)',
                    height: 'var(--control-height)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontFamily: 'var(--body)',
                    fontSize: 13,
                    color: 'var(--muted)',
                  }}
                >
                  <UploadIcon />
                  Drop PDF or click to browse
                </div>
              </div>

              {/* LinkedIn */}
              <div>
                <span className="field-label">LinkedIn</span>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/your-name"
                  style={{
                    width: '100%',
                    height: 'var(--control-height)',
                    background: 'var(--raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--body)',
                    fontSize: 13,
                    padding: '0 12px',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>

              {/* GitHub */}
              <div>
                <span className="field-label">GitHub</span>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="github.com/your-username"
                  style={{
                    width: '100%',
                    height: 'var(--control-height)',
                    background: 'var(--raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--body)',
                    fontSize: 13,
                    padding: '0 12px',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>
            </div>

            {/* Row 2: Challenge/role + Import button */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span className="field-label">Challenge you picked + your role</span>
                <input
                  type="text"
                  value={challengeRole}
                  onChange={(e) => setChallengeRole(e.target.value)}
                  placeholder="e.g. Smart City challenge, Frontend Dev role"
                  style={{
                    width: '100%',
                    height: 'var(--control-height)',
                    background: 'var(--raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--body)',
                    fontSize: 13,
                    padding: '0 12px',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>
              <button
                className="btn primary"
                style={{ height: 'var(--control-height)', padding: '0 24px', fontSize: 12, flexShrink: 0 }}
              >
                Import
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ SPLIT VIEW ============ */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* ---------- CHAT PANEL (40%, max 560px) ---------- */}
        <div
          style={{
            width: '40%',
            maxWidth: 560,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border)',
            background: 'var(--ground)',
          }}
        >
          {/* Messages */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--panel-pad)' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: 16 }}>
                {/* Role label */}
                <div
                  style={{
                    fontFamily: 'var(--body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: msg.role === 'ai' ? 'var(--accent)' : 'var(--you)',
                    marginBottom: 4,
                    letterSpacing: '.04em',
                  }}
                >
                  {msg.role === 'ai' ? 'AI MATCHMAKER' : 'YOU'}
                </div>

                {/* Bubble */}
                <div
                  style={{
                    background: msg.role === 'ai' ? 'var(--surface)' : 'var(--raised)',
                    border: '1px solid var(--border)',
                    padding: '10px 12px',
                    fontFamily: 'var(--sans)',
                    fontSize: 14,
                    color: 'var(--text)',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}

                  {/* Editable chips */}
                  {msg.chips && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Idea */}
                      <div>
                        <span style={{ fontFamily: 'var(--meta)', fontSize: 12, color: 'var(--muted)', marginRight: 6 }}>IDEA:</span>
                        {msg.chips.idea && (
                          <EditableChip
                            value={msg.chips.idea}
                            onChange={(v) => handleChipChange(msg.id, 'idea', null, v)}
                            onRemove={() => handleChipRemove(msg.id, 'idea', null)}
                          />
                        )}
                      </div>

                      {/* Skills */}
                      <div>
                        <span style={{ fontFamily: 'var(--meta)', fontSize: 12, color: 'var(--muted)', marginRight: 6 }}>SKILLS:</span>
                        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
                          {msg.chips.skills.map((s, i) => (
                            <EditableChip
                              key={`${s}-${i}`}
                              value={s}
                              onChange={(v) => handleChipChange(msg.id, 'skills', i, v)}
                              onRemove={() => handleChipRemove(msg.id, 'skills', i)}
                            />
                          ))}
                        </span>
                      </div>

                      {/* Role */}
                      <div>
                        <span style={{ fontFamily: 'var(--meta)', fontSize: 12, color: 'var(--muted)', marginRight: 6 }}>ROLE:</span>
                        {msg.chips.role && (
                          <EditableChip
                            value={msg.chips.role}
                            onChange={(v) => handleChipChange(msg.id, 'role', null, v)}
                            onRemove={() => handleChipRemove(msg.id, 'role', null)}
                          />
                        )}
                      </div>

                      {/* Interests */}
                      <div>
                        <span style={{ fontFamily: 'var(--meta)', fontSize: 12, color: 'var(--muted)', marginRight: 6 }}>INTERESTS:</span>
                        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
                          {msg.chips.interests.map((s, i) => (
                            <EditableChip
                              key={`${s}-${i}`}
                              value={s}
                              onChange={(v) => handleChipChange(msg.id, 'interests', i, v)}
                              onRemove={() => handleChipRemove(msg.id, 'interests', i)}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Match button */}
                  {msg.showMatchButton && !hasMatched && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="pixel-btn primary"
                        style={{ fontSize: 12, padding: '8px 16px' }}
                        onClick={handleMatch}
                      >
                        LOOKS RIGHT -- MATCH ME
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Suggested prompts (only when initial state) */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="pixel-btn"
                    style={{
                      fontSize: 12,
                      padding: '5px 10px',
                      color: 'var(--muted)',
                      textAlign: 'left',
                      lineHeight: 1.4,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input bar -- pinned to bottom of chat column via flex layout */}
          <div
            style={{
              flexShrink: 0,
              borderTop: '1px solid var(--border)',
              padding: 'var(--panel-pad)',
              display: 'flex',
              gap: 8,
              background: 'var(--surface)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Tell me about yourself..."
              style={{
                flex: 1,
                background: 'var(--raised)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'var(--sans)',
                fontSize: 14,
                padding: '8px 12px',
                outline: 'none',
              }}
            />
            <button
              className="pixel-btn primary"
              style={{ fontSize: 12, padding: '8px 14px', flexShrink: 0 }}
              onClick={() => handleSend()}
            >
              SEND
            </button>
          </div>
        </div>

        {/* ---------- RESULTS PANEL (fills remaining space) ---------- */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--ground)',
          }}
        >
          {/* Tab bar + sort */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
              padding: '0 var(--panel-pad)',
              background: 'var(--surface)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', gap: 0, minWidth: 0 }}>
              <button
                onClick={() => setActiveTab('teams')}
                style={{
                  background: activeTab === 'teams' ? 'var(--ground)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'teams' ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '10px 16px',
                  fontFamily: 'var(--meta)',
                  fontSize: 12,
                  color: activeTab === 'teams' ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer',
                  letterSpacing: '.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                TEAMS{hasMatched ? ` ${teamResults.length}` : ''}
              </button>
              <button
                onClick={() => setActiveTab('people')}
                style={{
                  background: activeTab === 'people' ? 'var(--ground)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'people' ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '10px 16px',
                  fontFamily: 'var(--meta)',
                  fontSize: 12,
                  color: activeTab === 'people' ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer',
                  letterSpacing: '.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                PEOPLE
              </button>
            </div>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as 'best' | 'all')}
              style={{
                background: 'var(--raised)',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                fontFamily: 'var(--meta)',
                fontSize: 12,
                padding: '4px 8px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <option value="best">Best fit</option>
              <option value="all">All teams</option>
            </select>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--panel-pad)' }}>
            {!hasMatched && sortMode === 'best' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: 32,
                }}
              >
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <p
                  style={{
                    fontFamily: 'var(--body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--muted)',
                    textAlign: 'center',
                    lineHeight: 1.6,
                    marginTop: 8,
                  }}
                >
                  Tell the AI matchmaker about yourself to see ranked matches here.
                </p>
              </div>
            )}

            {(hasMatched || sortMode === 'all') && activeTab === 'teams' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {matchLoading && teamResults.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontFamily: 'var(--body)', fontSize: 14 }}>
                    Matching...
                  </div>
                )}

                {filteredTeams.slice(0, visibleTeams).map((team) => {
                  const joined = joinedTeams.has(team.id);
                  const matchedRole = team.matched_role?.toLowerCase();
                  return (
                    <div key={team.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--body)', fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                            {team.name}
                          </div>
                          <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)' }}>
                            {team.challenge || 'Open challenge'} — {team.members}/{team.max_size} members
                          </div>
                        </div>
                        {sortMode === 'best' && (
                          <div
                            className="num"
                            style={{
                              fontSize: 20,
                              color: 'var(--accent)',
                              lineHeight: 1,
                              flexShrink: 0,
                              marginLeft: 12,
                            }}
                          >
                            {team.fit}%
                          </div>
                        )}
                      </div>

                      {/* Needed roles — highlight the matched one */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                        {team.needed_roles.map((role) => (
                          <span
                            key={role}
                            className="skill-tag"
                            style={
                              matchedRole && role.toLowerCase() === matchedRole
                                ? { background: 'var(--accent)', color: 'var(--ink)', borderColor: 'var(--accent)' }
                                : {}
                            }
                          >
                            {role}
                          </span>
                        ))}
                      </div>

                      {/* Reason */}
                      <p
                        style={{
                          fontFamily: 'var(--body)',
                          fontSize: 13,
                          color: 'var(--muted)',
                          fontStyle: 'italic',
                          marginBottom: 12,
                          lineHeight: 1.4,
                        }}
                      >
                        {team.reason}
                      </p>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {joined ? (
                          <span
                            style={{
                              fontFamily: 'var(--meta)',
                              fontSize: 12,
                              color: 'var(--accent)',
                              padding: '6px 10px',
                              border: '1px solid var(--accent)',
                              background: 'var(--raised)',
                            }}
                          >
                            REQUESTED
                          </span>
                        ) : (
                          <button
                            className="btn primary"
                            style={{ fontSize: 12, padding: '6px 10px' }}
                            onClick={() => handleJoin(team.id)}
                          >
                            Request to join
                          </button>
                        )}
                        <button
                          className="btn"
                          style={{ fontSize: 12, padding: '6px 10px' }}
                          onClick={() => handleSkip(team.id)}
                        >
                          Skip
                        </button>
                        <Link
                          to={`/map/teams?select=${team.id}`}
                          className="btn"
                          style={{ fontSize: 12, padding: '6px 10px', textDecoration: 'none', display: 'inline-block' }}
                        >
                          Show on map
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {filteredTeams.length > visibleTeams && (
                  <button
                    className="btn"
                    style={{ width: '100%', padding: '10px', fontSize: 12, marginTop: 4 }}
                    onClick={() => setVisibleTeams((v) => v + 5)}
                  >
                    Show more
                  </button>
                )}

                {filteredTeams.length > 0 && filteredTeams.length <= visibleTeams && !matchLoading && (
                  <button
                    className="btn"
                    style={{ width: '100%', padding: '10px', fontSize: 12, marginTop: 4 }}
                    onClick={handleShowMore}
                  >
                    {matchLoading ? 'Loading...' : 'Load more matches'}
                  </button>
                )}

                {isFallback && (
                  <div style={{ fontFamily: 'var(--meta)', fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
                    Showing keyword-based results (AI matching is warming up)
                  </div>
                )}
              </div>
            )}

            {hasMatched && activeTab === 'people' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32 }}>
                <p style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
                  People matching coming soon. Use the Team map to find participants with similar backgrounds.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
