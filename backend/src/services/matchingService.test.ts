import { describe, it, expect } from 'vitest';
import {
  rankTeamsForParticipant,
  rankParticipantsForTeam,
} from './matchingService.js';

const makeTeam = (overrides: Partial<{
  id: string;
  name: string;
  project_idea: string;
  needed_roles: string[];
  status: string;
  lat: number | null;
  lng: number | null;
}> = {}) => ({
  id: 'team-1',
  name: 'Test Team',
  project_idea: 'A cool app',
  needed_roles: ['developer', 'designer'],
  status: 'open',
  lat: 61.4978,
  lng: 23.761,
  ...overrides,
});

const makeParticipant = (overrides: Partial<{
  id: string;
  name: string;
  roles: string[];
  skills: Array<{ name: string; level?: number }>;
  status: string;
  lat: number | null;
  lng: number | null;
}> = {}) => ({
  id: 'p-1',
  name: 'Alice',
  roles: ['developer'],
  skills: [{ name: 'TypeScript' }],
  status: 'looking',
  lat: 61.4978,
  lng: 23.761,
  ...overrides,
});

describe('rankTeamsForParticipant', () => {
  it('returns matching open teams sorted by score', () => {
    const participant = { roles: ['developer'], skills: [{ name: 'designer' }] };
    const teams = [
      makeTeam({ id: 't1', needed_roles: ['developer'] }),
      makeTeam({ id: 't2', needed_roles: ['developer', 'designer'] }),
      makeTeam({ id: 't3', needed_roles: ['marketing'] }),
    ];

    const result = rankTeamsForParticipant(participant, teams);

    expect(result).toHaveLength(2);
    // t2 matches both roles → score 1.0; t1 matches one of one → score 1.0 too
    // t3 matches zero → excluded
    const ids = result.map((r) => r.teamId);
    expect(ids).toContain('t1');
    expect(ids).toContain('t2');
    expect(ids).not.toContain('t3');
  });

  it('excludes closed teams', () => {
    const participant = { roles: ['developer'], skills: [] };
    const teams = [
      makeTeam({ id: 't-open', status: 'open' }),
      makeTeam({ id: 't-closed', status: 'closed' }),
    ];

    const result = rankTeamsForParticipant(participant, teams);

    expect(result.map((r) => r.teamId)).toEqual(['t-open']);
  });

  it('excludes teams with no needed_roles', () => {
    const participant = { roles: ['developer'], skills: [] };
    const teams = [makeTeam({ needed_roles: [] })];

    const result = rankTeamsForParticipant(participant, teams);

    expect(result).toHaveLength(0);
  });

  it('limits results to 5', () => {
    const participant = { roles: ['developer'], skills: [] };
    const teams = Array.from({ length: 10 }, (_, i) =>
      makeTeam({ id: `t${i}`, needed_roles: ['developer'] })
    );

    const result = rankTeamsForParticipant(participant, teams);

    expect(result).toHaveLength(5);
  });

  it('scoring is case-insensitive', () => {
    const participant = { roles: ['Developer'], skills: [] };
    const teams = [makeTeam({ needed_roles: ['developer'] })];

    const result = rankTeamsForParticipant(participant, teams);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(1);
  });

  it('includes reason strings for matched roles', () => {
    const participant = { roles: ['developer'], skills: [] };
    const teams = [makeTeam({ needed_roles: ['developer'] })];

    const result = rankTeamsForParticipant(participant, teams);

    expect(result[0].reasons[0]).toContain('developer');
  });
});

describe('rankParticipantsForTeam', () => {
  it('returns matching looking participants sorted by score', () => {
    const team = { needed_roles: ['developer', 'designer'] };
    const participants = [
      makeParticipant({ id: 'p1', roles: ['developer'], skills: [{ name: 'designer' }] }),
      makeParticipant({ id: 'p2', roles: ['developer'], skills: [] }),
      makeParticipant({ id: 'p3', roles: ['marketing'], skills: [] }),
    ];

    const result = rankParticipantsForTeam(team, participants);

    expect(result).toHaveLength(2);
    expect(result[0].participantId).toBe('p1'); // higher score
    expect(result[1].participantId).toBe('p2');
  });

  it('excludes non-looking participants', () => {
    const team = { needed_roles: ['developer'] };
    const participants = [
      makeParticipant({ id: 'p-looking', status: 'looking' }),
      makeParticipant({ id: 'p-matched', status: 'matched' }),
    ];

    const result = rankParticipantsForTeam(team, participants);

    expect(result.map((p) => p.participantId)).toEqual(['p-looking']);
  });

  it('handles null skills gracefully', () => {
    const team = { needed_roles: ['developer'] };
    const participants = [
      makeParticipant({ roles: ['developer'], skills: null as unknown as Array<{ name: string }> }),
    ];

    const result = rankParticipantsForTeam(team, participants);

    expect(result).toHaveLength(1);
    expect(result[0].skills).toEqual([]);
  });

  it('returns empty when team needs no roles', () => {
    const team = { needed_roles: [] };
    const participants = [makeParticipant()];

    const result = rankParticipantsForTeam(team, participants);

    expect(result).toHaveLength(0);
  });

  it('limits results to 5', () => {
    const team = { needed_roles: ['developer'] };
    const participants = Array.from({ length: 10 }, (_, i) =>
      makeParticipant({ id: `p${i}`, roles: ['developer'] })
    );

    const result = rankParticipantsForTeam(team, participants);

    expect(result).toHaveLength(5);
  });

  it('skill matching is case-insensitive', () => {
    const team = { needed_roles: ['TypeScript'] };
    const participants = [
      makeParticipant({ roles: [], skills: [{ name: 'typescript' }] }),
    ];

    const result = rankParticipantsForTeam(team, participants);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(1);
  });
});
