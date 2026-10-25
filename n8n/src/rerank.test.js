import { describe, it, expect } from 'vitest';
const { rerank, roleFit, dupPenalty, normaliseWeights, DEFAULT_WEIGHTS } = require('./rerank.js');

/* ── Test candidates (mirrors seed data shape from hybrid_search) ── */

const CANDIDATES = [
  { id: 't1', name: 'SmartFlow', challenge: 'Smart City', zone: null, needed_roles: ['frontend developer', 'ml engineer', 'ux designer'], member_roles: ['backend developer'], members: 2, max_size: 5, overlap: 1.0, rrf: 0.8 },
  { id: 't2', name: 'GreenGrid', challenge: 'Sustainability', zone: null, needed_roles: ['frontend developer', 'backend developer', 'product manager'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.9 },
  { id: 't3', name: 'MindBridge', challenge: 'Health Tech', zone: null, needed_roles: ['mobile developer', 'ux designer', 'data scientist'], member_roles: ['ml engineer'], members: 2, max_size: 5, overlap: 1.0, rrf: 0.5 },
  { id: 't4', name: 'LearnLoop', challenge: 'Education', zone: null, needed_roles: ['ml engineer', 'backend developer', 'ux designer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.6 },
  { id: 't5', name: 'PayLite', challenge: 'Fintech', zone: null, needed_roles: ['backend developer', 'fullstack developer', 'product manager'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.4 },
  { id: 't6', name: 'QuestCity', challenge: 'Gaming', zone: null, needed_roles: ['mobile developer', 'frontend developer', 'ml engineer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.3 },
  { id: 't7', name: 'CareBridge', challenge: 'Social Impact', zone: null, needed_roles: ['fullstack developer', 'ux designer', 'data scientist'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.35 },
  { id: 't8', name: 'CarbonTrace', challenge: 'Climate', zone: null, needed_roles: ['backend developer', 'frontend developer', 'devops engineer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.7 },
  // Duplicate challenge for diversity test
  { id: 't9', name: 'SmartFlow 2', challenge: 'Smart City', zone: null, needed_roles: ['frontend developer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.75 },
  { id: 't10', name: 'GreenGrid 2', challenge: 'Sustainability', zone: null, needed_roles: ['frontend developer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.85 },
];

/* ── roleFit ── */

describe('roleFit', () => {
  it('returns 1.0 when primary role matches needed_roles', () => {
    const result = roleFit(['frontend developer'], ['frontend developer', 'ml engineer']);
    expect(result.score).toBe(1.0);
    expect(result.matched).toBe('frontend developer');
  });

  it('returns 0.6 for adjacent primary role (fullstack → frontend)', () => {
    const result = roleFit(['fullstack developer'], ['frontend developer', 'ml engineer']);
    expect(result.score).toBe(0.6);
    expect(result.matched).toBe('frontend developer');
  });

  it('returns 0.8 for secondary role match', () => {
    const result = roleFit(['marketing', 'ux designer'], ['ux designer', 'ml engineer']);
    expect(result.score).toBe(0.8);
    expect(result.matched).toBe('ux designer');
  });

  it('returns 0 when no role matches', () => {
    const result = roleFit(['devops engineer'], ['ux designer', 'ml engineer']);
    expect(result.score).toBe(0);
    expect(result.matched).toBeNull();
  });

  it('handles empty needed_roles', () => {
    const result = roleFit(['frontend developer'], []);
    expect(result.score).toBe(0);
  });

  it('is case-insensitive', () => {
    const result = roleFit(['Frontend Developer'], ['frontend developer']);
    expect(result.score).toBe(1.0);
  });

  it('ux designer → ui designer adjacency works', () => {
    const result = roleFit(['ux designer'], ['ui designer']);
    expect(result.score).toBe(0.8);
    expect(result.matched).toBe('ui designer');
  });
});

/* ── dupPenalty ── */

describe('dupPenalty', () => {
  it('returns 0 when no role overlap', () => {
    expect(dupPenalty(['frontend developer'], ['backend developer'])).toBe(0);
  });

  it('returns 0.15 for 1 overlapping role', () => {
    expect(dupPenalty(['frontend developer'], ['frontend developer', 'ml engineer'])).toBe(0.15);
  });

  it('caps at 0.3', () => {
    expect(dupPenalty(['frontend developer', 'backend developer', 'ml engineer'], ['frontend developer', 'backend developer', 'ml engineer'])).toBe(0.3);
  });

  it('returns 0 for empty member roles', () => {
    expect(dupPenalty(['frontend developer'], [])).toBe(0);
  });
});

/* ── normaliseWeights ── */

describe('normaliseWeights', () => {
  it('normalises weights to sum 1', () => {
    const w = normaliseWeights({ interest: 0.4, role: 0.4, avail: 0.2 });
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('returns defaults for zero weights', () => {
    const w = normaliseWeights({ interest: 0, role: 0, avail: 0 });
    expect(w).toEqual(DEFAULT_WEIGHTS);
  });

  it('handles feedback weight adjustment', () => {
    // After "not my challenge" decline: interest bumped
    const w = normaliseWeights({ interest: 0.40, role: 0.35, avail: 0.30 });
    expect(w.interest).toBeGreaterThan(w.role);
  });
});

/* ── rerank ── */

describe('rerank', () => {
  const frontendProfile = {
    roles: ['frontend developer'],
    skills: ['React', 'TypeScript'],
    interests: ['sustainability'],
  };

  it('returns at most `limit` results', () => {
    const results = rerank(frontendProfile, CANDIDATES, { limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('first result has the highest fit (MMR may reorder the rest)', () => {
    const results = rerank(frontendProfile, CANDIDATES, { limit: 5 });
    // First pick is always the best score; MMR diversifies the rest
    for (let i = 1; i < results.length; i++) {
      expect(results[0].fit).toBeGreaterThanOrEqual(results[i].fit);
    }
  });

  it('a frontend dev ranks a team needing frontend above one that does not (all else equal)', () => {
    const needsFrontend = [
      { id: 'a', name: 'A', challenge: 'X', zone: null, needed_roles: ['frontend developer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.5 },
      { id: 'b', name: 'B', challenge: 'Y', zone: null, needed_roles: ['devops engineer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.5 },
    ];
    const results = rerank(frontendProfile, needsFrontend, { limit: 2 });
    expect(results[0].id).toBe('a');
    expect(results[0].factors.role).toBe(1.0);
    expect(results[1].factors.role).toBe(0);
  });

  it('excludes teams in exclude_ids', () => {
    const results = rerank(frontendProfile, CANDIDATES, { excludeIds: ['t1', 't2'], limit: 10 });
    const ids = results.map(r => r.id);
    expect(ids).not.toContain('t1');
    expect(ids).not.toContain('t2');
  });

  it('every result has a fit between 0 and 100', () => {
    const results = rerank(frontendProfile, CANDIDATES, { limit: 10 });
    for (const r of results) {
      expect(r.fit).toBeGreaterThanOrEqual(0);
      expect(r.fit).toBeLessThanOrEqual(100);
    }
  });

  it('every result has factors with values between 0 and 1', () => {
    const results = rerank(frontendProfile, CANDIDATES, { limit: 10 });
    for (const r of results) {
      expect(r.factors.interest).toBeGreaterThanOrEqual(0);
      expect(r.factors.interest).toBeLessThanOrEqual(1);
      expect(r.factors.role).toBeGreaterThanOrEqual(0);
      expect(r.factors.role).toBeLessThanOrEqual(1);
      expect(r.factors.avail).toBeGreaterThanOrEqual(0);
      expect(r.factors.avail).toBeLessThanOrEqual(1);
    }
  });

  it('applies duplicate role penalty', () => {
    const profile = { roles: ['frontend developer'], skills: [], interests: [] };
    const withDup = [
      { id: 'x', name: 'X', challenge: 'A', zone: null, needed_roles: ['frontend developer'], member_roles: ['frontend developer'], members: 2, max_size: 5, overlap: 1.0, rrf: 0.8 },
      { id: 'y', name: 'Y', challenge: 'B', zone: null, needed_roles: ['frontend developer'], member_roles: [], members: 1, max_size: 5, overlap: 1.0, rrf: 0.8 },
    ];
    const results = rerank(profile, withDup, { limit: 2 });
    // Y (no dup) should rank above X (has dup penalty)
    expect(results[0].id).toBe('y');
  });

  it('diversifies across challenges (MMR) — top 5 has at least 2 different challenges', () => {
    const results = rerank(frontendProfile, CANDIDATES, { limit: 5 });
    const challenges = new Set(results.map(r => r.challenge).filter(Boolean));
    expect(challenges.size).toBeGreaterThanOrEqual(2);
  });

  it('handles empty candidates', () => {
    const results = rerank(frontendProfile, [], { limit: 5 });
    expect(results).toEqual([]);
  });

  it('handles profile with no roles', () => {
    const emptyProfile = { roles: [], skills: [], interests: [] };
    const results = rerank(emptyProfile, CANDIDATES, { limit: 5 });
    expect(results.length).toBeGreaterThan(0);
    // All role factors should be 0
    for (const r of results) {
      expect(r.factors.role).toBe(0);
    }
  });

  it('fullstack developer gets partial credit for frontend team', () => {
    const fsProfile = { roles: ['fullstack developer'], skills: [], interests: [] };
    const results = rerank(fsProfile, [CANDIDATES[0]], { limit: 1 }); // SmartFlow needs frontend
    expect(results[0].factors.role).toBe(0.6);
    expect(results[0].matched_role).toBe('frontend developer');
  });

  it('respects adjusted weights from feedback', () => {
    // Bump interest weight heavily
    const highInterest = { interest: 0.8, role: 0.1, avail: 0.1 };
    const results = rerank(frontendProfile, CANDIDATES, { weights: highInterest, limit: 5 });
    // GreenGrid has highest rrf (0.9) so should rank top when interest is weighted heavily
    expect(results[0].id).toBe('t2');
  });
});
