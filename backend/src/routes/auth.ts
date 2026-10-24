import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { query } from '../db.js';
import type { JwtPayload, UserType, AuthTokens } from '../types/auth.js';

const router = Router();

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['participant', 'mentor']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['participant', 'mentor']),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return secret;
}

function issueTokens(userId: string, userType: UserType): AuthTokens {
  const payload: JwtPayload = { userId, userType };
  const secret = getJwtSecret();
  const accessToken = jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = crypto.randomBytes(48).toString('hex');
  return { accessToken, refreshToken };
}

async function storeRefreshToken(
  userId: string,
  userType: UserType,
  rawToken: string
): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, userType, tokenHash, expiresAt.toISOString()]
  );
}

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const { name, email, password, role } = parsed.data;

  try {
    // Check email uniqueness across both tables
    const [participantCheck, mentorCheck] = await Promise.all([
      query('SELECT id FROM participants WHERE email = $1', [email]),
      query('SELECT id FROM mentors WHERE email = $1', [email]),
    ]);

    if ((participantCheck.rowCount ?? 0) > 0 || (mentorCheck.rowCount ?? 0) > 0) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let userId: string;
    if (role === 'participant') {
      const result = await query(
        `INSERT INTO participants (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        [name, email, passwordHash]
      );
      userId = result.rows[0].id as string;
    } else {
      const result = await query(
        `INSERT INTO mentors (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        [name, email, passwordHash]
      );
      userId = result.rows[0].id as string;
    }

    const tokens = issueTokens(userId, role);
    await storeRefreshToken(userId, role, tokens.refreshToken);

    res.status(201).json({
      user: { id: userId, name, email, role },
      tokens,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const { email, password, role } = parsed.data;

  try {
    const table = role === 'participant' ? 'participants' : 'mentors';
    const result = await query(
      `SELECT id, name, email, password_hash FROM ${table} WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0] as { id: string; name: string; email: string; password_hash: string };
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const tokens = issueTokens(user.id, role);
    await storeRefreshToken(user.id, role, tokens.refreshToken);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role },
      tokens,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const { refreshToken } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  try {
    const result = await query(
      `SELECT id, user_id, user_type FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > now()`,
      [tokenHash]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const row = result.rows[0] as { id: string; user_id: string; user_type: UserType };

    // Delete old token (rotation)
    await query('DELETE FROM refresh_tokens WHERE id = $1', [row.id]);

    const tokens = issueTokens(row.user_id, row.user_type);
    await storeRefreshToken(row.user_id, row.user_type, tokens.refreshToken);

    res.json({ tokens });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const parsed = logoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const { refreshToken } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  try {
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
