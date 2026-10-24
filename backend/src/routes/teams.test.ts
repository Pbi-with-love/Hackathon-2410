import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TEST_JWT_SECRET, authHeader, dbResult, emptyResult } from '../test-helpers/auth.js';

vi.mock('../db.js', () => ({ query: vi.fn() }));
vi.mock('../cache.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheInvalidate: vi.fn().mockResolvedValue(undefined),
}));

import { query } from '../db.js';
import teamsRouter from './teams.js';

const app = express();
app.use(express.json());
app.use('/teams', teamsRouter);

const mockQuery = vi.mocked(query);

beforeAll(() => { process.env.JWT_SECRET = TEST_JWT_SECRET; });
beforeEach(() => { mockQuery.mockReset(); });

const CAPTAIN_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const TEAM_ID = 'cccccccc-0000-0000-0000-000000000003';
const OTHER_ID = 'bbbbbbbb-0000-0000-0000-000000000002';

const teamRow = {
  id: TEAM_ID,
  name: 'Dream Team',
  captain_id: CAPTAIN_ID,
  project_idea: 'A cool app',
  goals: null,
  needed_roles: ['developer'],
  status: 'open',
  lat: null,
  lng: null,
  created_at: new Date().toISOString(),
};

// ─── POST /teams ───────────────────────────────────────────────────────────

describe('POST /teams', () => {
  it('returns 201 with team on success', async () => {
    mockQuery
      .mockResolvedValueOnce(dbResult([teamRow]))  // INSERT team
      .mockResolvedValueOnce(emptyResult)           // INSERT team_members
      .mockResolvedValueOnce(emptyResult);          // UPDATE participant status

    const res = await request(app)
      .post('/teams')
      .set('Authorization', authHeader(CAPTAIN_ID, 'participant'))
      .send({ name: 'Dream Team', needed_roles: ['developer'] });

    expect(res.status).toBe(201);
    expect(res.body.team.id).toBe(TEAM_ID);
  });

  it('returns 403 when mentor tries to create a team', async () => {
    const res = await request(app)
      .post('/teams')
      .set('Authorization', authHeader(CAPTAIN_ID, 'mentor'))
      .send({ name: 'Dream Team' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/teams')
      .set('Authorization', authHeader(CAPTAIN_ID))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/teams').send({ name: 'x' });
    expect(res.status).toBe(401);
  });
});

// ─── GET /teams/:id ────────────────────────────────────────────────────────

describe('GET /teams/:id', () => {
  it('returns 200 with team data', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([{ ...teamRow, captain_name: 'Alice', captain_email: 'alice@test.com' }]));

    const res = await request(app)
      .get(`/teams/${TEAM_ID}`)
      .set('Authorization', authHeader(CAPTAIN_ID));

    expect(res.status).toBe(200);
    expect(res.body.team.id).toBe(TEAM_ID);
  });

  it('returns 404 when team not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get(`/teams/${TEAM_ID}`)
      .set('Authorization', authHeader(CAPTAIN_ID));

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get(`/teams/${TEAM_ID}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /teams/:id ──────────────────────────────────────────────────────

describe('PATCH /teams/:id', () => {
  it('returns 200 when captain updates team', async () => {
    const updated = { ...teamRow, project_idea: 'New idea' };
    mockQuery
      .mockResolvedValueOnce(dbResult([{ captain_id: CAPTAIN_ID }]))  // ownership check
      .mockResolvedValueOnce(dbResult([updated]));                    // UPDATE

    const res = await request(app)
      .patch(`/teams/${TEAM_ID}`)
      .set('Authorization', authHeader(CAPTAIN_ID))
      .send({ project_idea: 'New idea' });

    expect(res.status).toBe(200);
    expect(res.body.team.project_idea).toBe('New idea');
  });

  it('returns 404 when team not found during update', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .patch(`/teams/${TEAM_ID}`)
      .set('Authorization', authHeader(CAPTAIN_ID))
      .send({ name: 'New name' });

    expect(res.status).toBe(404);
  });

  it('returns 403 when non-captain tries to update', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([{ captain_id: CAPTAIN_ID }]));

    const res = await request(app)
      .patch(`/teams/${TEAM_ID}`)
      .set('Authorization', authHeader(OTHER_ID))
      .send({ name: 'Hijack' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when no fields to update', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([{ captain_id: CAPTAIN_ID }]));

    const res = await request(app)
      .patch(`/teams/${TEAM_ID}`)
      .set('Authorization', authHeader(CAPTAIN_ID))
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── GET /teams/:id/members ────────────────────────────────────────────────

describe('GET /teams/:id/members', () => {
  it('returns 200 with members list', async () => {
    mockQuery
      .mockResolvedValueOnce(dbResult([{ id: TEAM_ID }]))  // team exists
      .mockResolvedValueOnce(dbResult([{ id: CAPTAIN_ID, name: 'Alice' }]));  // members

    const res = await request(app)
      .get(`/teams/${TEAM_ID}/members`)
      .set('Authorization', authHeader(CAPTAIN_ID));

    expect(res.status).toBe(200);
    expect(res.body.members).toHaveLength(1);
  });

  it('returns 404 when team not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get(`/teams/${TEAM_ID}/members`)
      .set('Authorization', authHeader(CAPTAIN_ID));

    expect(res.status).toBe(404);
  });
});
