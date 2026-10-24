import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TEST_JWT_SECRET, authHeader, dbResult, emptyResult } from '../test-helpers/auth.js';

vi.mock('../db.js', () => ({ query: vi.fn() }));

import { query } from '../db.js';
import mapRouter from './map.js';

const app = express();
app.use(express.json());
app.use('/map', mapRouter);

const mockQuery = vi.mocked(query);
const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

beforeAll(() => { process.env.JWT_SECRET = TEST_JWT_SECRET; });
beforeEach(() => { mockQuery.mockReset(); });

// ─── GET /map/teams ────────────────────────────────────────────────────────

describe('GET /map/teams', () => {
  it('returns 200 with teams and participants', async () => {
    const participant = { id: 'p-1', name: 'Alice', skills: [], roles: ['developer'], lat: 61.5, lng: 23.7 };
    const team = {
      id: 't-1', name: 'Team A', project_idea: 'Idea', needed_roles: ['developer'],
      lat: 61.5, lng: 23.7, captain_id: USER_ID, captain_name: 'Bob',
    };

    mockQuery
      .mockResolvedValueOnce(dbResult([participant]))  // looking participants
      .mockResolvedValueOnce(dbResult([team]));        // open teams

    const res = await request(app)
      .get('/map/teams')
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.teams).toHaveLength(1);
    expect(res.body.participants).toHaveLength(1);
    expect(res.body.teams[0].captain.id).toBe(USER_ID);
  });

  it('returns empty arrays when nothing on map', async () => {
    mockQuery
      .mockResolvedValueOnce(emptyResult)
      .mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get('/map/teams')
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.teams).toHaveLength(0);
    expect(res.body.participants).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/map/teams');
    expect(res.status).toBe(401);
  });
});

// ─── GET /map/mentors ──────────────────────────────────────────────────────

describe('GET /map/mentors', () => {
  it('returns 200 with mentors', async () => {
    const mentor = {
      id: 'm-1', name: 'Carol', expertise: ['AI'], experience: '3y',
      status: 'available', lat: 61.5, lng: 23.7,
    };

    mockQuery.mockResolvedValueOnce(dbResult([mentor]));

    const res = await request(app)
      .get('/map/mentors')
      .set('Authorization', authHeader(USER_ID));

    expect(res.status).toBe(200);
    expect(res.body.mentors).toHaveLength(1);
    expect(res.body.mentors[0].id).toBe('m-1');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/map/mentors');
    expect(res.status).toBe(401);
  });
});
