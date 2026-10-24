import { useEffect, useState, useMemo, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import CanvasMap, { type MapMarker } from '../components/CanvasMap';

/* ── Data interfaces ── */

interface Captain {
  id: string;
  name: string;
  email?: string;
}

interface TeamMarker {
  id: string;
  name: string;
  project_idea: string | null;
  needed_roles: string[];
  challenge?: string;
  goals?: string;
  zone?: string;
  lat: number;
  lng: number;
  captain: Captain;
}

interface ParticipantMarker {
  id: string;
  name: string;
  skills: string[];
  roles: string[];
  lat: number;
  lng: number;
}

interface MapData {
  teams: TeamMarker[];
  participants: ParticipantMarker[];
}

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  skills?: string[];
}

interface TeamDetail {
  id: string;
  name: string;
  project_idea: string | null;
  needed_roles: string[];
  challenge?: string;
  goals?: string;
  zone?: string;
  captain: Captain;
}

/* ── Helpers ── */

function collectAllRoles(teams: TeamMarker[]): string[] {
  const set = new Set<string>();
  for (const t of teams) {
    for (const r of t.needed_roles) set.add(r);
  }
  return Array.from(set).sort();
}

function collectAllChallenges(teams: TeamMarker[]): string[] {
  const set = new Set<string>();
  for (const t of teams) {
    if (t.challenge) set.add(t.challenge);
  }
  return Array.from(set).sort();
}

/* ── Component ── */

export default function TeamMatchingMapPage() {
  const { user } = useAuth();

  /* Map data */
  const [mapData, setMapData] = useState<MapData>({ teams: [], participants: [] });
  const [error, setError] = useState<string | null>(null);

  /* Filters */
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [challengeFilter, setChallengeFilter] = useState('');

  /* Selection */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinResult, setJoinResult] = useState<string | null>(null);

  /* Fetch map data */
  useEffect(() => {
    apiFetch('/map/teams')
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json()) as { error: string };
          throw new Error(b.error);
        }
        return res.json() as Promise<MapData>;
      })
      .then(setMapData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load'),
      );
  }, []);

  /* Derived filter options */
  const allRoles = useMemo(() => collectAllRoles(mapData.teams), [mapData.teams]);
  const allChallenges = useMemo(() => collectAllChallenges(mapData.teams), [mapData.teams]);

  /* Filtered teams */
  const filteredTeams = useMemo(() => {
    let list = mapData.teams;

    if (search.trim()) {
      const kw = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(kw) ||
          t.needed_roles.some((r) => r.toLowerCase().includes(kw)) ||
          t.project_idea?.toLowerCase().includes(kw) ||
          t.captain.name.toLowerCase().includes(kw),
      );
    }

    if (roleFilter) {
      list = list.filter((t) =>
        t.needed_roles.some((r) => r === roleFilter),
      );
    }

    if (challengeFilter) {
      list = list.filter((t) => t.challenge === challengeFilter);
    }

    return list;
  }, [mapData.teams, search, roleFilter, challengeFilter]);

  /* Map markers — team leads only */
  const markers: MapMarker[] = useMemo(
    () =>
      /* TODO: sprites currently land on seed lat/lng — see seed/zone-anchor fix */
      filteredTeams.map((t) => ({
        id: t.id,
        name: t.name,
        lat: t.lat,
        lng: t.lng,
        role: t.needed_roles[0],
        type: 'team' as const,
      })),
    [filteredTeams],
  );

  /* Select a team */
  const selectTeam = useCallback(
    (id: string | null) => {
      setJoinResult(null);

      if (!id) {
        setSelectedId(null);
        setTeamDetail(null);
        setTeamMembers([]);
        return;
      }

      setSelectedId(id);
      setDetailLoading(true);

      Promise.all([
        apiFetch(`/teams/${id}`).then(async (res) => {
          if (!res.ok) return null;
          return res.json() as Promise<TeamDetail>;
        }),
        apiFetch(`/teams/${id}/members`).then(async (res) => {
          if (!res.ok) return [];
          return res.json() as Promise<TeamMember[]>;
        }),
      ])
        .then(([detail, members]) => {
          setTeamDetail(detail);
          setTeamMembers(members);
        })
        .catch(() => {
          /* fall back to basic marker data */
          const t = mapData.teams.find((tm) => tm.id === id);
          if (t) {
            setTeamDetail({
              id: t.id,
              name: t.name,
              project_idea: t.project_idea,
              needed_roles: t.needed_roles,
              challenge: t.challenge,
              goals: t.goals,
              zone: t.zone,
              captain: t.captain,
            });
          }
          setTeamMembers([]);
        })
        .finally(() => setDetailLoading(false));
    },
    [mapData.teams],
  );

  /* Marker click on canvas */
  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      selectTeam(marker.id === selectedId ? null : marker.id);
    },
    [selectTeam, selectedId],
  );

  /* List item click */
  const handleListClick = useCallback(
    (id: string) => {
      selectTeam(id === selectedId ? null : id);
    },
    [selectTeam, selectedId],
  );

  /* Request to join */
  const handleJoinRequest = useCallback(async () => {
    if (!selectedId || !user) return;
    setJoinLoading(true);
    setJoinResult(null);
    try {
      const res = await apiFetch('/match/request', {
        method: 'POST',
        body: JSON.stringify({ teamId: selectedId }),
      });
      if (!res.ok) {
        const b = (await res.json()) as { error: string };
        throw new Error(b.error);
      }
      setJoinResult('Request sent');
    } catch (err: unknown) {
      setJoinResult(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setJoinLoading(false);
    }
  }, [selectedId, user]);

  /* Close drawer */
  const closeDrawer = useCallback(() => {
    setSelectedId(null);
    setTeamDetail(null);
    setTeamMembers([]);
    setJoinResult(null);
  }, []);

  /* The selected team from the list for highlighting */
  const selectedTeam = useMemo(
    () => (selectedId ? filteredTeams.find((t) => t.id === selectedId) : null),
    [filteredTeams, selectedId],
  );

  const drawerOpen = selectedId !== null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* ── Filter bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          flexShrink: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search team / skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search teams or skills"
          style={{
            width: 220,
            padding: '6px 10px',
            background: 'var(--raised)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'var(--sans)',
            fontSize: 14,
            outline: 'none',
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--primary)';
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
          }}
        />

        {/* Missing role dropdown */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by missing role"
          style={{
            padding: '6px 10px',
            background: 'var(--raised)',
            border: '1px solid var(--border)',
            color: roleFilter ? 'var(--text)' : 'var(--muted)',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
            minWidth: 150,
          }}
        >
          <option value="">Missing role</option>
          {allRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Challenge dropdown */}
        <select
          value={challengeFilter}
          onChange={(e) => setChallengeFilter(e.target.value)}
          aria-label="Filter by challenge"
          style={{
            padding: '6px 10px',
            background: 'var(--raised)',
            border: '1px solid var(--border)',
            color: challengeFilter ? 'var(--text)' : 'var(--muted)',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
            minWidth: 150,
          }}
        >
          <option value="">Challenge</option>
          {allChallenges.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: 'var(--meta)',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                background: '#3d8bfd',
              }}
            />
            Team leads {filteredTeams.length}
          </span>
        </div>

        {error && (
          <span
            style={{
              color: '#f87171',
              fontFamily: 'var(--sans)',
              fontSize: 12,
            }}
          >
            {error}
          </span>
        )}
      </div>

      {/* ── Main 3-panel area ── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ── Left: Team list ── */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border)',
            background: 'var(--bg)',
            overflow: 'hidden',
          }}
        >
          {/* List header */}
          <div
            style={{
              padding: '12px 14px 10px',
              fontFamily: 'var(--font)',
              fontSize: 13,
              color: 'var(--text)',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              background: 'var(--surface)',
            }}
          >
            {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}{' '}
            recruiting
          </div>

          {/* Scrollable list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {filteredTeams.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  fontFamily: 'var(--sans)',
                  fontSize: 13,
                  color: 'var(--muted)',
                }}
              >
                No teams match filters
              </div>
            )}

            {filteredTeams.map((t) => {
              const isActive = t.id === selectedId;
              const visibleRoles = t.needed_roles.slice(0, 2);
              const extraRolesCount = t.needed_roles.length - 2;
              return (
                <button
                  key={t.id}
                  onClick={() => handleListClick(t.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: isActive ? 'var(--raised)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isActive
                      ? '3px solid var(--accent)'
                      : '3px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        'var(--raised)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        'transparent';
                  }}
                >
                  {/* Team name */}
                  <div
                    style={{
                      fontFamily: 'var(--body)',
                      fontSize: 16,
                      fontWeight: 500,
                      color: isActive ? 'var(--accent)' : 'var(--text)',
                      marginBottom: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {t.name}
                  </div>

                  {/* Challenge */}
                  {t.challenge && (
                    <div
                      style={{
                        fontFamily: 'var(--meta)',
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        marginBottom: 6,
                      }}
                    >
                      {t.challenge}
                    </div>
                  )}

                  {/* Needed roles */}
                  {t.needed_roles.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 4,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--meta)',
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          marginRight: 2,
                        }}
                      >
                        Needs
                      </span>
                      {visibleRoles.map((r) => (
                        <span
                          key={r}
                          className="skill-tag"
                          style={{
                            fontFamily: 'var(--meta)',
                            fontSize: 11,
                          }}
                        >
                          {r}
                        </span>
                      ))}
                      {extraRolesCount > 0 && (
                        <span
                          style={{
                            fontFamily: 'var(--meta)',
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--muted)',
                          }}
                        >
                          +{extraRolesCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Captain + zone footer */}
                  <div
                    style={{
                      fontFamily: 'var(--body)',
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Capt. {t.captain.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Center: Canvas map ── */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <CanvasMap
            markers={markers}
            onMarkerClick={handleMarkerClick}
            selectedId={selectedId}
          />
        </div>

        {/* ── Right: Detail drawer ── */}
        {drawerOpen && (
          <div
            style={{
              width: 360,
              flexShrink: 0,
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Close button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '8px 10px 0',
                flexShrink: 0,
              }}
            >
              <button
                onClick={closeDrawer}
                className="btn"
                style={{ padding: '4px 12px', fontSize: 13 }}
                aria-label="Close detail drawer"
              >
                x
              </button>
            </div>

            {/* Scrollable content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px 16px 20px',
              }}
            >
              {detailLoading && (
                <div
                  style={{
                    fontFamily: 'var(--font)',
                    fontSize: 12,
                    color: 'var(--muted)',
                    padding: '20px 0',
                    textAlign: 'center',
                  }}
                >
                  Loading...
                </div>
              )}

              {!detailLoading && teamDetail && (
                <>
                  {/* Team name */}
                  <h2
                    style={{
                      fontFamily: 'var(--font)',
                      fontSize: 12,
                      color: 'var(--text)',
                      margin: '0 0 10px',
                      lineHeight: 1.5,
                    }}
                  >
                    {teamDetail.name}
                  </h2>

                  {/* Challenge */}
                  {teamDetail.challenge && (
                    <div
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: 14,
                        color: 'var(--primary)',
                        marginBottom: 12,
                      }}
                    >
                      {teamDetail.challenge}
                    </div>
                  )}

                  {/* Project idea */}
                  {teamDetail.project_idea && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font)',
                          fontSize: 12,
                          color: 'var(--muted)',
                          marginBottom: 4,
                        }}
                      >
                        PROJECT IDEA
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--sans)',
                          fontSize: 14,
                          color: 'var(--text)',
                          lineHeight: 1.5,
                        }}
                      >
                        {teamDetail.project_idea}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {teamDetail.goals && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font)',
                          fontSize: 12,
                          color: 'var(--muted)',
                          marginBottom: 4,
                        }}
                      >
                        GOALS
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--sans)',
                          fontSize: 13,
                          color: 'var(--muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {teamDetail.goals}
                      </div>
                    </div>
                  )}

                  {/* Members */}
                  {teamMembers.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font)',
                          fontSize: 12,
                          color: 'var(--muted)',
                          marginBottom: 6,
                        }}
                      >
                        MEMBERS ({teamMembers.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {teamMembers.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              background: 'var(--raised)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--sans)',
                                fontSize: 13,
                                color: 'var(--text)',
                              }}
                            >
                              {m.name}
                            </span>
                            {m.role && (
                              <span className="skill-tag">{m.role}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing roles */}
                  {teamDetail.needed_roles.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font)',
                          fontSize: 12,
                          color: 'var(--muted)',
                          marginBottom: 6,
                        }}
                      >
                        MISSING ROLES
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 5,
                        }}
                      >
                        {teamDetail.needed_roles.map((r) => (
                          <span
                            key={r}
                            className="skill-tag"
                            style={{
                              borderColor: 'var(--primary)',
                              color: 'var(--primary)',
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Captain info */}
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font)',
                        fontSize: 12,
                        color: 'var(--muted)',
                        marginBottom: 4,
                      }}
                    >
                      CAPTAIN
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: 13,
                        color: 'var(--text)',
                      }}
                    >
                      {teamDetail.captain.name}
                    </div>
                    {teamDetail.captain.email && (
                      <div
                        style={{
                          fontFamily: 'var(--sans)',
                          fontSize: 12,
                          color: 'var(--muted)',
                          marginTop: 2,
                        }}
                      >
                        {teamDetail.captain.email}
                      </div>
                    )}
                  </div>

                  {/* Zone */}
                  {teamDetail.zone && (
                    <div style={{ marginBottom: 18 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font)',
                          fontSize: 12,
                          color: 'var(--muted)',
                          marginBottom: 4,
                        }}
                      >
                        LOCATION ZONE
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--sans)',
                          fontSize: 13,
                          color: 'var(--text)',
                        }}
                      >
                        {teamDetail.zone}
                      </div>
                    </div>
                  )}

                  {/* Join button */}
                  {user && (
                    <div style={{ marginTop: 6 }}>
                      <button
                        className="btn primary"
                        disabled={joinLoading}
                        onClick={handleJoinRequest}
                        style={{
                          width: '100%',
                          padding: '10px 0',
                          fontSize: 13,
                          opacity: joinLoading ? 0.6 : 1,
                          cursor: joinLoading ? 'wait' : 'pointer',
                        }}
                      >
                        {joinLoading ? 'Sending...' : 'Request to join'}
                      </button>

                      {joinResult && (
                        <div
                          style={{
                            fontFamily: 'var(--sans)',
                            fontSize: 12,
                            color:
                              joinResult === 'Request sent'
                                ? '#22c55e'
                                : '#f87171',
                            textAlign: 'center',
                            marginTop: 8,
                          }}
                        >
                          {joinResult}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Fallback when detail not loaded but we have basic marker info */}
              {!detailLoading && !teamDetail && selectedTeam && (
                <>
                  <h2
                    style={{
                      fontFamily: 'var(--font)',
                      fontSize: 12,
                      color: 'var(--text)',
                      margin: '0 0 10px',
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedTeam.name}
                  </h2>

                  {selectedTeam.project_idea && (
                    <div
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: 14,
                        color: 'var(--text)',
                        marginBottom: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedTeam.project_idea}
                    </div>
                  )}

                  {selectedTeam.needed_roles.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 5,
                        marginBottom: 12,
                      }}
                    >
                      {selectedTeam.needed_roles.map((r) => (
                        <span
                          key={r}
                          className="skill-tag"
                          style={{
                            borderColor: 'var(--primary)',
                            color: 'var(--primary)',
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Captain: {selectedTeam.captain.name}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
