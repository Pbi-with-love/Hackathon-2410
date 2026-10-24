import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TEST_JWT_SECRET, dbResult, emptyResult } from '../test-helpers/auth.js';

vi.mock('../db.js', () => ({ query: vi.fn() }));

import { query } from '../db.js';
import authRouter from './auth.js';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

const mockQuery = vi.mocked(query);

beforeAll(() => {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
});

beforeEach(() => {
  mockQuery.mockReset();
});

// ─── POST /auth/register ───────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('returns 201 with user and tokens on success (participant)', async () => {
    // no existing email
    mockQuery
      .mockResolvedValueOnce(emptyResult)  // participants check
      .mockResolvedValueOnce(emptyResult)  // mentors check
      .mockResolvedValueOnce(dbResult([{ id: 'user-123' }]))  // INSERT participant
      .mockResolvedValueOnce(emptyResult); // INSERT refresh_token

    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
      role: 'participant',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ id: 'user-123', name: 'Alice', role: 'participant' });
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
  });

  it('returns 201 for mentor role', async () => {
    mockQuery
      .mockResolvedValueOnce(emptyResult)
      .mockResolvedValueOnce(emptyResult)
      .mockResolvedValueOnce(dbResult([{ id: 'mentor-1' }]))
      .mockResolvedValueOnce(emptyResult);

    const res = await request(app).post('/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
      role: 'mentor',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('mentor');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'Alice' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'not-an-email',
      password: 'password123',
      role: 'participant',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for password shorter than 8 chars', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'short',
      role: 'participant',
    });
    expect(res.status).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    mockQuery
      .mockResolvedValueOnce(dbResult([{ id: 'existing' }]))  // participant hit
      .mockResolvedValueOnce(emptyResult);

    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
      role: 'participant',
    });
    expect(res.status).toBe(409);
  });
});

// ─── POST /auth/login ──────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('returns 200 with tokens on valid credentials', async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('password123', 1);

    mockQuery
      .mockResolvedValueOnce(dbResult([{ id: 'u-1', name: 'Alice', email: 'alice@test.com', password_hash: hash }]))
      .mockResolvedValueOnce(emptyResult); // store refresh token

    const res = await request(app).post('/auth/login').send({
      email: 'alice@test.com',
      password: 'password123',
      role: 'participant',
    });

    expect(res.status).toBe(200);
    expect(res.body.tokens).toHaveProperty('accessToken');
  });

  it('returns 401 when user not found', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app).post('/auth/login').send({
      email: 'nobody@test.com',
      password: 'password123',
      role: 'participant',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 on wrong password', async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('correct-password', 1);

    mockQuery.mockResolvedValueOnce(
      dbResult([{ id: 'u-1', name: 'Alice', email: 'alice@test.com', password_hash: hash }])
    );

    const res = await request(app).post('/auth/login').send({
      email: 'alice@test.com',
      password: 'wrong-password',
      role: 'participant',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /auth/refresh ────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('returns 200 with new tokens on valid refresh token', async () => {
    mockQuery
      .mockResolvedValueOnce(dbResult([{ id: 'rt-1', user_id: 'u-1', user_type: 'participant' }]))
      .mockResolvedValueOnce(emptyResult)  // DELETE old token
      .mockResolvedValueOnce(emptyResult); // INSERT new token

    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'some-token-value' });

    expect(res.status).toBe(200);
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
  });

  it('returns 401 when refresh token is invalid/expired', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'bad-token' });
    expect(res.status).toBe(401);
  });

  it('returns 400 on missing refreshToken', async () => {
    const res = await request(app).post('/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

// ─── POST /auth/logout ─────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('returns 200 on valid logout', async () => {
    mockQuery.mockResolvedValueOnce(emptyResult);

    const res = await request(app).post('/auth/logout').send({ refreshToken: 'some-token' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out');
  });

  it('returns 400 on missing refreshToken', async () => {
    const res = await request(app).post('/auth/logout').send({});
    expect(res.status).toBe(400);
  });
});
