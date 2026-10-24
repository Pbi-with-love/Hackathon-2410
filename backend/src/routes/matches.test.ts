import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TEST_JWT_SECRET, authHeader, dbResult, emptyResult } from '../test-helpers/auth.js';
import type { PoolClient } from 'pg';

vi.mock('../db.js', () => ({ query: vi.fn(), getClient: vi.fn() }));

import { query, getClient } from '../db.js';
import matchRouter from './matches.js';

const app = express();
app.use(express.json());
app.use('/match', matchRouter);

const mockQuery = vi.mocked(query);
const mockGetClient = vi.mocked(getClient);

beforeAll(() => { process.env.JWT_SECRET = TEST_JWT_SECRET; });
beforeEach(() => {
  mockQuery.mockReset();
  mockGetClient.mockReset();
});

const PARTICIPANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const CAPTAIN_ID     = '550e8400-e29b-41d4-a716-446655440002';
const TEAM_ID        = '550e8400-e29b-41d4-a716-446655440003';
const MATCH_ID       = '550e8400-e29b-41d4-a716-446655440004';

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: MATCH_ID,
    participant_id: PARTICIPANT_ID,
    team_id: TEAM_ID,
    direction: 'team_to_participant',
    state: 'invited',
    score: 0,
    reasons: [],
    captain_id: CAPTAIN_ID,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeMockClient() {
  const clientQuery = vi.fn();
  const client = { query: clientQuery, release: vi.fn() } as unknown as PoolClient;
  mockGetClient.mockResolvedValue(client);
  return clientQuery;
}

// ─── POST /match/invite ────────────────────────────────────────────────────

describe('POST /match/invite', () => {
  it('returns 201 when captain invites a participant', async () => {
    const match = makeMatch();
    mockQuery
      .mockResolvedValueOnce(dbResult([{ id: TEAM_ID }]))  // captain check
      .mockResolvedValueOnce(emptyResult)                   // no existing match
      .mockResolvedValueOnce(dbResult([match]));            // INSERT match

    const res = await request(app)
      .post('/match/invite')
      .set('Authorization', authHeader(CAPTAIN_ID))
      .send({ participantId: PARTICIPANT_ID });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(MATCH_ID);
  });

  it('returns 403 when non-captain tries to invite', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);  // no team for this user

    const res = await request(app)
      .post('/match/invite')
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ participantId: PARTICIPANT_ID });

    expect(res.status).toBe(403);
  });

  it('returns 409 when open match already exists', async () => {
    mockQuery
      .mockResolvedValueOnce(dbResult([{ id: TEAM_ID }]))  // captain check
      .mockResolvedValueOnce(dbResult([{ id: MATCH_ID }])); // existing match

    const res = await request(app)
      .post('/match/invite')
      .set('Authorization', authHeader(CAPTAIN_ID))
      .send({ participantId: PARTICIPANT_ID });

    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid participantId (not UUID)', async () => {
    const res = await request(app)
      .post('/match/invite')
      .set('Authorization', authHeader(CAPTAIN_ID))
      .send({ participantId: 'not-a-uuid' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/match/invite').send({ participantId: PARTICIPANT_ID });
    expect(res.status).toBe(401);
  });
});

// ─── POST /match/request ───────────────────────────────────────────────────

describe('POST /match/request', () => {
  it('returns 201 when participant requests to join a team', async () => {
    const match = makeMatch({ direction: 'participant_to_team', state: 'requested' });
    mockQuery
      .mockResolvedValueOnce(emptyResult)       // no existing match
      .mockResolvedValueOnce(dbResult([match])); // INSERT match

    const res = await request(app)
      .post('/match/request')
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ teamId: TEAM_ID });

    expect(res.status).toBe(201);
    expect(res.body.direction).toBe('participant_to_team');
  });

  it('returns 409 when open match already exists', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([{ id: MATCH_ID }]));

    const res = await request(app)
      .post('/match/request')
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ teamId: TEAM_ID });

    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid teamId (not UUID)', async () => {
    const res = await request(app)
      .post('/match/request')
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ teamId: 'bad-id' });

    expect(res.status).toBe(400);
  });
});

// ─── POST /match/:id/respond ───────────────────────────────────────────────

describe('POST /match/:id/respond', () => {
  it('returns 200 when participant declines an invite', async () => {
    const match = makeMatch();
    const declined = { ...match, state: 'declined' };
    mockQuery
      .mockResolvedValueOnce(dbResult([match]))    // fetch match
      .mockResolvedValueOnce(dbResult([declined])); // UPDATE to declined

    const res = await request(app)
      .post(`/match/${MATCH_ID}/respond`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ action: 'decline' });

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('declined');
  });

  it('returns 200 when participant accepts an invite (transaction path)', async () => {
    const match = makeMatch();
    const accepted = { ...match, state: 'accepted' };
    mockQuery.mockResolvedValueOnce(dbResult([match]));  // fetch match

    const clientQuery = makeMockClient();
    clientQuery.mockResolvedValue({ rows: [] });  // BEGIN, UPDATEs, INSERT, COMMIT

    mockQuery.mockResolvedValueOnce(dbResult([accepted]));  // final SELECT

    const res = await request(app)
      .post(`/match/${MATCH_ID}/respond`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ action: 'accept' });

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('accepted');
  });

  it('returns 404 when match not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .post(`/match/${MATCH_ID}/respond`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ action: 'decline' });

    expect(res.status).toBe(404);
  });

  it('returns 403 when wrong party responds to invite', async () => {
    const match = makeMatch();  // invited: participant_id should respond
    mockQuery.mockResolvedValueOnce(dbResult([match]));

    const res = await request(app)
      .post(`/match/${MATCH_ID}/respond`)
      .set('Authorization', authHeader(CAPTAIN_ID))  // captain trying to respond to invite
      .send({ action: 'accept' });

    expect(res.status).toBe(403);
  });

  it('returns 403 when non-captain responds to join request', async () => {
    const match = makeMatch({ state: 'requested', direction: 'participant_to_team' });
    mockQuery.mockResolvedValueOnce(dbResult([match]));

    const OTHER_ID = '550e8400-e29b-41d4-a716-446655440006';
    const res = await request(app)
      .post(`/match/${MATCH_ID}/respond`)
      .set('Authorization', authHeader(OTHER_ID))
      .send({ action: 'accept' });

    expect(res.status).toBe(403);
  });

  it('returns 409 when match is already accepted/declined', async () => {
    const match = makeMatch({ state: 'accepted' });
    mockQuery.mockResolvedValueOnce(dbResult([match]));

    const res = await request(app)
      .post(`/match/${MATCH_ID}/respond`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ action: 'decline' });

    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid action', async () => {
    const res = await request(app)
      .post(`/match/${MATCH_ID}/respond`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ action: 'maybe' });

    expect(res.status).toBe(400);
  });
});

// ─── GET /matches ──────────────────────────────────────────────────────────

describe('GET /matches', () => {
  it('returns 200 with pending matches for authenticated user', async () => {
    const matchRow = {
      id: MATCH_ID,
      participant_id: PARTICIPANT_ID,
      team_id: TEAM_ID,
      direction: 'team_to_participant',
      state: 'invited',
      participant_name: 'Alice',
      participant_roles: ['developer'],
      team_name: 'Dream Team',
      team_project_idea: 'Cool app',
      captain_id: CAPTAIN_ID,
      score: 0,
      reasons: [],
      created_at: new Date().toISOString(),
    };
    mockQuery.mockResolvedValueOnce(dbResult([matchRow]));

    const res = await request(app)
      .get('/match')
      .set('Authorization', authHeader(PARTICIPANT_ID));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  it('returns empty array when no pending matches', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get('/match')
      .set('Authorization', authHeader(PARTICIPANT_ID));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/match');
    expect(res.status).toBe(401);
  });
});
