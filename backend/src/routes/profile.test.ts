import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TEST_JWT_SECRET, authHeader } from '../test-helpers/auth.js';

// profileExtractor is a pure mock service — no need to re-mock it
// but we verify validation and happy-path response

import profileRouter from './profile.js';

const app = express();
app.use(express.json());
app.use('/profile', profileRouter);

beforeAll(() => { process.env.JWT_SECRET = TEST_JWT_SECRET; });

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

describe('POST /profile/extract', () => {
  it('returns 200 with extracted profile for valid prompt', async () => {
    const res = await request(app)
      .post('/profile/extract')
      .set('Authorization', authHeader(USER_ID))
      .send({ prompt: 'I am a frontend developer with 3 years of React experience' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile).toHaveProperty('skills');
    expect(res.body.profile).toHaveProperty('roles');
  });

  it('returns 400 when prompt is too short', async () => {
    const res = await request(app)
      .post('/profile/extract')
      .set('Authorization', authHeader(USER_ID))
      .send({ prompt: 'short' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when prompt is missing', async () => {
    const res = await request(app)
      .post('/profile/extract')
      .set('Authorization', authHeader(USER_ID))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/profile/extract')
      .send({ prompt: 'I am a developer with lots of experience' });

    expect(res.status).toBe(401);
  });
});
