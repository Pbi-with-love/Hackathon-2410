import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TEST_JWT_SECRET, authHeader, dbResult, emptyResult } from '../test-helpers/auth.js';

vi.mock('../db.js', () => ({ query: vi.fn() }));

import { query } from '../db.js';
import suggestionsRouter from './matching.js';

const app = express();
app.use(express.json());
app.use('/suggestions', suggestionsRouter);

const mockQuery = vi.mocked(query);

beforeAll(() => { process.env.JWT_SECRET = TEST_JWT_SECRET; });
beforeEach(() => { mockQuery.mockReset(); });

const PARTICIPANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEAM_ID        = '550e8400-e29b-41d4-a716-446655440003';
const USER_ID        = '550e8400-e29b-41d4-a716-446655440006';

// ─── GET /suggestions/teams/:participantId ─────────────────────────────────

describe('GET /suggestions/teams/:participantId', () => {
  it('returns 200 with matching team suggestions', async () => {
    const participant = { id: PARTICIPANT_ID, roles: ['developer'], skills: [{ name: 'TypeScript' }] };
    const team = {
      id: TEAM_ID, name: 'Team A', project_idea: 'Idea',
      needed_roles: ['developer'], status: 'open', lat: 61.5, lng: 23.7,
    };

    mockQuery
      .mockResolvedValueOnce(dbResult([participant]))
      .mockResolvedValueOnce(dbResult([team]));

    const res = await request(app)
      .get(`/suggestions/teams/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('suggestions');
    expect(res.body.suggestions).toHaveLength(1);
    expect(res.body.suggestions[0].teamId).toBe(TEAM_ID);
    expect(res.body.suggestions[0].score).toBeGreaterThan(0);
  });

  it('returns empty suggestions when no roles match', async () => {
    const participant = { id: PARTICIPANT_ID, roles: ['designer'], skills: [] };
    const team = {
      id: TEAM_ID, name: 'Team A', project_idea: 'Idea',
      needed_roles: ['marketing'], status: 'open', lat: 61.5, lng: 23.7,
    };

    mockQuery
      .mockResolvedValueOnce(dbResult([participant]))
      .mockResolvedValueOnce(dbResult([team]));

    const res = await request(app)
      .get(`/suggestions/teams/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(0);
  });

  it('returns 404 when participant not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get(`/suggestions/teams/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get(`/suggestions/teams/${PARTICIPANT_ID}`);
    expect(res.status).toBe(401);
  });
});

// ─── GET /suggestions/participants/:teamId ─────────────────────────────────

describe('GET /suggestions/participants/:teamId', () => {
  it('returns 200 with matching participant suggestions', async () => {
    const team = { id: TEAM_ID, needed_roles: ['developer'] };
    const participant = {
      id: PARTICIPANT_ID, name: 'Alice',
      skills: [{ name: 'TypeScript' }], roles: ['developer'],
      status: 'looking', lat: 61.5, lng: 23.7,
    };

    mockQuery
      .mockResolvedValueOnce(dbResult([team]))
      .mockResolvedValueOnce(dbResult([participant]));

    const res = await request(app)
      .get(`/suggestions/participants/${TEAM_ID}`)
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(1);
    expect(res.body.suggestions[0].participantId).toBe(PARTICIPANT_ID);
  });

  it('returns 404 when team not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get(`/suggestions/participants/${TEAM_ID}`)
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get(`/suggestions/participants/${TEAM_ID}`);
    expect(res.status).toBe(401);
  });
});
