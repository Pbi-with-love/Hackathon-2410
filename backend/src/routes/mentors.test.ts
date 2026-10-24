import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TEST_JWT_SECRET, authHeader, dbResult, emptyResult } from '../test-helpers/auth.js';

vi.mock('../db.js', () => ({ query: vi.fn() }));
vi.mock('../cache.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheInvalidatePattern: vi.fn().mockResolvedValue(undefined),
}));

import { query } from '../db.js';
import mentorsRouter from './mentors.js';

const app = express();
app.use(express.json());
app.use('/mentors', mentorsRouter);

const mockQuery = vi.mocked(query);

beforeAll(() => { process.env.JWT_SECRET = TEST_JWT_SECRET; });
beforeEach(() => { mockQuery.mockReset(); });

const MENTOR_ID = 'dddddddd-0000-0000-0000-000000000004';
const OTHER_ID = 'eeeeeeee-0000-0000-0000-000000000005';

const mentorRow = {
  id: MENTOR_ID,
  name: 'Carol',
  email: 'carol@test.com',
  expertise: ['AI', 'ML'],
  experience: '5 years in AI',
  status: 'available',
  lat: 61.4978,
  lng: 23.761,
  created_at: new Date().toISOString(),
};

// ─── GET /mentors ──────────────────────────────────────────────────────────

describe('GET /mentors', () => {
  it('returns 200 with all mentors (no auth required)', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([mentorRow]));

    const res = await request(app).get('/mentors');

    expect(res.status).toBe(200);
    expect(res.body.mentors).toHaveLength(1);
  });

  it('returns 200 filtered by expertise query param', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([mentorRow]));

    const res = await request(app).get('/mentors?expertise=AI');

    expect(res.status).toBe(200);
    // verify a query with the expertise filter was called
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      expect.arrayContaining(['%AI%'])
    );
  });

  it('returns empty array when no mentors match', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app).get('/mentors?expertise=Blockchain');
    expect(res.status).toBe(200);
    expect(res.body.mentors).toHaveLength(0);
  });
});

// ─── GET /mentors/:id ──────────────────────────────────────────────────────

describe('GET /mentors/:id', () => {
  it('returns 200 with mentor', async () => {
    mockQuery.mockResolvedValueOnce(dbResult([mentorRow]));

    const res = await request(app)
      .get(`/mentors/${MENTOR_ID}`)
      .set('Authorization', authHeader(MENTOR_ID, 'mentor'));

    expect(res.status).toBe(200);
    expect(res.body.mentor.id).toBe(MENTOR_ID);
  });

  it('returns 404 when mentor not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .get(`/mentors/${MENTOR_ID}`)
      .set('Authorization', authHeader(MENTOR_ID, 'mentor'));

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get(`/mentors/${MENTOR_ID}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /mentors/:id ────────────────────────────────────────────────────

describe('PATCH /mentors/:id', () => {
  it('returns 200 when mentor updates own profile', async () => {
    const updated = { ...mentorRow, status: 'busy' };
    mockQuery.mockResolvedValueOnce(dbResult([updated]));

    const res = await request(app)
      .patch(`/mentors/${MENTOR_ID}`)
      .set('Authorization', authHeader(MENTOR_ID, 'mentor'))
      .send({ status: 'busy' });

    expect(res.status).toBe(200);
    expect(res.body.mentor.status).toBe('busy');
  });

  it('returns 403 when updating another mentors profile', async () => {
    const res = await request(app)
      .patch(`/mentors/${MENTOR_ID}`)
      .set('Authorization', authHeader(OTHER_ID, 'mentor'))
      .send({ status: 'busy' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when no valid fields provided', async () => {
    const res = await request(app)
      .patch(`/mentors/${MENTOR_ID}`)
      .set('Authorization', authHeader(MENTOR_ID, 'mentor'))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .patch(`/mentors/${MENTOR_ID}`)
      .set('Authorization', authHeader(MENTOR_ID, 'mentor'))
      .send({ status: 'invisible' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when mentor not found in DB', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app)
      .patch(`/mentors/${MENTOR_ID}`)
      .set('Authorization', authHeader(MENTOR_ID, 'mentor'))
      .send({ status: 'busy' });

    expect(res.status).toBe(404);
  });
});
