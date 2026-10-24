import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  name: string;
  fit: number;
  challenge: string;
  missing: string[];
  reason: string;
  members: number;
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

const MOCK_TEAMS: TeamCard[] = [
  { name: 'SmartFlow', fit: 92, challenge: 'Smart City', missing: ['Frontend Dev', 'ML Engineer', 'UX Designer'], reason: "This team needs a Frontend Dev -- that's your top skill", members: 2 },
  { name: 'GreenGrid', fit: 87, challenge: 'Sustainability', missing: ['Frontend Dev', 'Backend Dev', 'PM'], reason: 'You fill their Frontend gap and share sustainability interests', members: 2 },
  { name: 'LearnLoop', fit: 78, challenge: 'Education', missing: ['ML Engineer', 'Backend Dev', 'UX Designer'], reason: 'Your ML background complements their adaptive learning platform', members: 2 },
  { name: 'CarbonTrace', fit: 71, challenge: 'Climate', missing: ['Backend Dev', 'Frontend Dev', 'DevOps'], reason: 'Strong skill overlap in frontend -- they need someone like you', members: 3 },
  { name: 'MindBridge', fit: 65, challenge: 'Health Tech', missing: ['Mobile Dev', 'UX Designer', 'Data Scientist'], reason: 'Your UX skills would strengthen their health check-in app', members: 2 },
];

const MOCK_PEOPLE = [
  { name: 'Mika T.', skills: ['Backend Dev', 'DevOps'], looking: 'ML project' },
  { name: 'Sana R.', skills: ['UX Designer'], looking: 'Sustainability team' },
  { name: 'Leo K.', skills: ['ML Engineer', 'Data Scientist'], looking: 'Health Tech' },
  { name: 'Priya D.', skills: ['Frontend Dev', 'Mobile Dev'], looking: 'Education project' },
  { name: 'Jens M.', skills: ['Backend Dev', 'PM'], looking: 'Smart City team' },
  { name: 'Aiko S.', skills: ['UX Designer', 'Frontend Dev'], looking: 'Climate project' },
  { name: 'Omar F.', skills: ['DevOps', 'Backend Dev'], looking: 'Any team' },
  { name: 'Yuki W.', skills: ['ML Engineer'], looking: 'Health Tech' },
  { name: 'Elena P.', skills: ['Data Scientist', 'ML Engineer'], looking: 'Smart City' },
  { name: 'Tom B.', skills: ['Frontend Dev'], looking: 'Education team' },
  { name: 'Rani G.', skills: ['Mobile Dev', 'UX Designer'], looking: 'Sustainability' },
  { name: 'Max L.', skills: ['PM', 'Backend Dev'], looking: 'Any project' },
];

const SUGGESTED_PROMPTS = [
  "I'm a frontend dev looking for a sustainability project",
  'I want to build an AI-powered education tool',
  'I have experience in ML and want to join a health-tech team',
];

const USER_ROLE = 'Frontend Dev';

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
  const [visibleTeams, setVisibleTeams] = useState(3);
  const [joinedTeams, setJoinedTeams] = useState<Set<string>>(new Set());
  const [skippedTeams, setSkippedTeams] = useState<Set<string>>(new Set());

  /* auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const nextId = () => Math.max(0, ...messages.map((m) => m.id)) + 1;

  function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: msg };
    const aiReply: ChatMessage = {
      id: nextId() + 1,
      role: 'ai',
      text: "Here's what I picked up:",
      chips: {
        idea: 'Sustainability dashboard',
        skills: ['React', 'TypeScript', 'Tailwind CSS'],
        role: 'Frontend Dev',
        interests: ['Green tech', 'Data viz'],
      },
      showMatchButton: true,
    };

    setMessages((prev) => [...prev, userMsg, aiReply]);
  }

  function handleMatch() {
    setHasMatched(true);
    const confirmMsg: ChatMessage = {
      id: nextId(),
      role: 'ai',
      text: 'Great -- I found some teams that fit your profile. Check the results panel on the right.',
    };
    setMessages((prev) => [...prev, confirmMsg]);
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

  function handleJoin(teamName: string) {
    setJoinedTeams((prev) => new Set(prev).add(teamName));
  }

  function handleSkip(teamName: string) {
    setSkippedTeams((prev) => new Set(prev).add(teamName));
  }

  const filteredTeams = MOCK_TEAMS.filter((t) => !skippedTeams.has(t.name));

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ground)' }}>
      {/* ============ IMPORT BAR ============ */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
          <button
            onClick={() => setImportOpen(!importOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--meta)',
              fontSize: 12,
              color: 'var(--accent)',
              letterSpacing: '.04em',
            }}
          >
            {importOpen ? 'v' : '>'} IMPORT CV / PROFILE
          </button>
          {!importOpen && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--meta)',
                fontSize: 11,
                color: 'var(--muted)',
                letterSpacing: '.02em',
              }}
            >
              <UploadIcon /> Upload a CV or paste a link
            </span>
          )}
        </div>

        {importOpen && (
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {/* CV drop area */}
            <div style={{ flex: '1 1 160px', minWidth: 140 }}>
              <span className="field-label" style={{ marginBottom: 4 }}>CV</span>
              <div
                style={{
                  border: '1px dashed var(--border)',
                  background: 'var(--raised)',
                  padding: '14px 12px',
                  fontFamily: 'var(--sans)',
                  fontSize: 13,
                  color: 'var(--muted)',
                  textAlign: 'center',
                }}
              >
                Drop PDF here
              </div>
            </div>

            {/* LinkedIn */}
            <div style={{ flex: '1 1 180px', minWidth: 140 }}>
              <span className="field-label" style={{ marginBottom: 4 }}>LINKEDIN URL</span>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="field-input"
                style={{ marginBottom: 0 }}
              />
            </div>

            {/* GitHub */}
            <div style={{ flex: '1 1 180px', minWidth: 140 }}>
              <span className="field-label" style={{ marginBottom: 4 }}>GITHUB URL</span>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="field-input"
                style={{ marginBottom: 0 }}
              />
            </div>

            {/* Challenge + role */}
            <div style={{ flex: '2 1 240px', minWidth: 180 }}>
              <span className="field-label" style={{ marginBottom: 4 }}>CHALLENGE / ROLE</span>
              <textarea
                rows={2}
                value={challengeRole}
                onChange={(e) => setChallengeRole(e.target.value)}
                placeholder="e.g. Smart City challenge, looking for Frontend Dev role"
                className="field-input"
                style={{ marginBottom: 0, resize: 'none' }}
              />
            </div>

            {/* Import button */}
            <div style={{ flexShrink: 0 }}>
              <button className="pixel-btn primary" style={{ padding: '10px 18px', fontSize: 12 }}>
                IMPORT
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
                TEAMS{hasMatched ? ` ${filteredTeams.length}` : ''}
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
                PEOPLE{hasMatched ? ` ${MOCK_PEOPLE.length}` : ''}
              </button>
            </div>

            <select
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
              <option>Best fit</option>
              <option>Newest</option>
              <option>Most members</option>
            </select>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--panel-pad)' }}>
            {!hasMatched && (
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

            {hasMatched && activeTab === 'teams' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredTeams.slice(0, visibleTeams).map((team) => {
                  const joined = joinedTeams.has(team.name);
                  return (
                    <div key={team.name} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                            {team.name}
                          </div>
                          <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)' }}>
                            {team.challenge} -- {team.members} members
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--meta)',
                            fontSize: 18,
                            color: 'var(--accent)',
                            lineHeight: 1,
                            flexShrink: 0,
                            marginLeft: 12,
                          }}
                        >
                          {team.fit}%
                        </div>
                      </div>

                      {/* Missing roles */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                        {team.missing.map((role) => (
                          <span
                            key={role}
                            className="skill-tag"
                            style={
                              role === USER_ROLE
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
                          fontFamily: 'var(--sans)',
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
                            className="pixel-btn primary"
                            style={{ fontSize: 12, padding: '6px 10px' }}
                            onClick={() => handleJoin(team.name)}
                          >
                            REQUEST TO JOIN
                          </button>
                        )}
                        <button
                          className="pixel-btn"
                          style={{ fontSize: 12, padding: '6px 10px' }}
                          onClick={() => handleSkip(team.name)}
                        >
                          SKIP
                        </button>
                        <Link
                          to="/map/teams"
                          className="pixel-btn"
                          style={{ fontSize: 12, padding: '6px 10px', textDecoration: 'none', display: 'inline-block' }}
                        >
                          SHOW ON MAP
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {visibleTeams < filteredTeams.length && (
                  <button
                    className="pixel-btn"
                    style={{ width: '100%', padding: '10px', fontSize: 12, marginTop: 4 }}
                    onClick={() => setVisibleTeams((v) => v + 5)}
                  >
                    SHOW MORE MATCHES
                  </button>
                )}
              </div>
            )}

            {hasMatched && activeTab === 'people' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MOCK_PEOPLE.map((person) => (
                  <div key={person.name} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--text)' }}>{person.name}</span>
                      <span style={{ fontFamily: 'var(--meta)', fontSize: 12, color: 'var(--muted)' }}>Looking for: {person.looking}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {person.skills.map((s) => (
                        <span key={s} className="skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
