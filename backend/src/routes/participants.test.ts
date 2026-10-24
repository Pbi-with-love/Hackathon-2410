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
import participantsRouter from './participants.js';

const app = express();
app.use(express.json());
app.use('/participants', participantsRouter);

const mockQuery = vi.mocked(query);

beforeAll(() => { process.env.JWT_SECRET = TEST_JWT_SECRET; });
beforeEach(() => { mockQuery.mockReset(); });

const PARTICIPANT_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

const participantRow = {
  id: PARTICIPANT_ID,
  name: 'Alice',
  email: 'alice@test.com',
  bio: 'Hi',
  skills: [],
  roles: ['developer'],
  interests: [],
  availability: null,
  status: 'looking',
  lat: 61.4978,
  lng: 23.761,
  created_at: new Date().toISOString(),
};

// ─── GET /participants/:id ─────────────────────────────────────────────────

describe('GET /participants/:id', () => {
  it('returns 200 with participant on cache miss', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([participantRow]));

    const res = await request(app)
      .get(`/participants/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(PARTICIPANT_ID));

    expect(res.status).toBe(200);
    expect(res.body.participant.id).toBe(PARTICIPANT_ID);
  });

  it('returns 404 when participant not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get(`/participants/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(PARTICIPANT_ID));

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth header', async () => {
    const res = await request(app).get(`/participants/${PARTICIPANT_ID}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /participants/:id ───────────────────────────────────────────────

describe('PATCH /participants/:id', () => {
  it('returns 200 with updated participant', async () => {
    const updated = { ...participantRow, bio: 'Updated bio' };
    mockQuery.mockResolvedValueOnce(dbResult([updated]));

    const res = await request(app)
      .patch(`/participants/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ bio: 'Updated bio' });

    expect(res.status).toBe(200);
    expect(res.body.participant.bio).toBe('Updated bio');
  });

  it('returns 403 when updating another users profile', async () => {
    const OTHER_ID = 'bbbbbbbb-0000-0000-0000-000000000002';

    const res = await request(app)
      .patch(`/participants/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(OTHER_ID))
      .send({ bio: 'Sneaky update' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when no valid fields provided', async () => {
    const res = await request(app)
      .patch(`/participants/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 when participant not found in DB', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .patch(`/participants/${PARTICIPANT_ID}`)
      .set('Authorization', authHeader(PARTICIPANT_ID))
      .send({ bio: 'hi' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .patch(`/participants/${PARTICIPANT_ID}`)
      .send({ bio: 'hi' });

    expect(res.status).toBe(401);
  });
});
