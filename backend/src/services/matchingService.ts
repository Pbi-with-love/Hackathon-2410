export interface TeamSuggestion {
  teamId: string;
  teamName: string;
  projectIdea: string;
  neededRoles: string[];
  score: number;
  reasons: string[];
  lat: number | null;
  lng: number | null;
}

export interface ParticipantSuggestion {
  participantId: string;
  name: string;
  skills: Array<{ name: string; level: number }>;
  roles: string[];
  score: number;
  reasons: string[];
}

export function rankTeamsForParticipant(
  participant: { roles: string[]; skills: Array<{ name: string }> },
  teams: Array<{
    id: string;
    name: string;
    project_idea: string;
    needed_roles: string[];
    status: string;
    lat: number | null;
    lng: number | null;
  }>
): TeamSuggestion[] {
  const participantTokens = new Set([
    ...participant.roles.map((r) => r.toLowerCase()),
    ...participant.skills.map((s) => s.name.toLowerCase()),
  ]);

  const openTeams = teams.filter((t) => t.status === 'open');

  const scored = openTeams
    .map((team) => {
      if (team.needed_roles.length === 0) {
        return null;
      }

      const matched: string[] = [];
      for (const role of team.needed_roles) {
        if (participantTokens.has(role.toLowerCase())) {
          matched.push(role);
        }
      }

      const score = matched.length / team.needed_roles.length;
      if (score === 0) return null;

      const reasons = matched.map(
        (role) => `This team needs a ${role} — that matches your skills`
      );

      return {
        teamId: team.id,
        teamName: team.name,
        projectIdea: team.project_idea ?? '',
        neededRoles: team.needed_roles,
        score,
        reasons,
        lat: team.lat,
        lng: team.lng,
      } satisfies TeamSuggestion;
    })
    .filter((s): s is TeamSuggestion => s !== null);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

export function rankParticipantsForTeam(
  team: { needed_roles: string[] },
  participants: Array<{
    id: string;
    name: string;
    skills: unknown;
    roles: string[];
    status: string;
    lat: number | null;
    lng: number | null;
  }>
): ParticipantSuggestion[] {
  const lookingParticipants = participants.filter(
    (p) => p.status === 'looking'
  );

  const scored = lookingParticipants
    .map((participant) => {
      if (team.needed_roles.length === 0) return null;

      const rawSkills = participant.skills as Array<{ name: string; level?: number }> | null;
      const skills: Array<{ name: string; level: number }> = Array.isArray(rawSkills)
        ? rawSkills.map((s) => ({ name: s.name, level: s.level ?? 1 }))
        : [];

      const participantTokens = new Set([
        ...participant.roles.map((r) => r.toLowerCase()),
        ...skills.map((s) => s.name.toLowerCase()),
      ]);

      const matched: string[] = [];
      for (const role of team.needed_roles) {
        if (participantTokens.has(role.toLowerCase())) {
          matched.push(role);
        }
      }

      const score = matched.length / team.needed_roles.length;
      if (score === 0) return null;

      const reasons = matched.map(
        (role) => `Fills the ${role} gap your team needs`
      );

      return {
        participantId: participant.id,
        name: participant.name,
        skills,
        roles: participant.roles,
        score,
        reasons,
      } satisfies ParticipantSuggestion;
    })
    .filter((s): s is ParticipantSuggestion => s !== null);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}
