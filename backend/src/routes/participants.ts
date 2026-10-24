import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const UpdateParticipantSchema = z.object({
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  status: z.enum(['looking', 'in_team']).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

// GET /participants/:id
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };

  try {
    const result = await query(
      `SELECT id, name, email, bio, skills, roles, interests, availability, status, lat, lng, created_at
       FROM participants WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    res.json({ participant: result.rows[0] });
  } catch (err) {
    console.error('GET /participants/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /participants/:id
router.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };

  if (req.user?.userId !== id) {
    res.status(403).json({ error: 'Forbidden: can only update your own profile' });
    return;
  }

  const parsed = UpdateParticipantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (data.bio !== undefined) {
    setClauses.push(`bio = $${paramIdx++}`);
    values.push(data.bio);
  }
  if (data.skills !== undefined) {
    setClauses.push(`skills = $${paramIdx++}::jsonb`);
    values.push(JSON.stringify(data.skills));
  }
  if (data.roles !== undefined) {
    setClauses.push(`roles = $${paramIdx++}::text[]`);
    values.push(data.roles);
  }
  if (data.interests !== undefined) {
    setClauses.push(`interests = $${paramIdx++}::text[]`);
    values.push(data.interests);
  }
  if (data.status !== undefined) {
    setClauses.push(`status = $${paramIdx++}`);
    values.push(data.status);
  }
  if (data.lat !== undefined) {
    setClauses.push(`lat = $${paramIdx++}`);
    values.push(data.lat);
  }
  if (data.lng !== undefined) {
    setClauses.push(`lng = $${paramIdx++}`);
    values.push(data.lng);
  }

  if (setClauses.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(id);

  try {
    const result = await query(
      `UPDATE participants SET ${setClauses.join(', ')}
       WHERE id = $${paramIdx}
       RETURNING id, name, email, bio, skills, roles, interests, availability, status, lat, lng, created_at`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    res.json({ participant: result.rows[0] });
  } catch (err) {
    console.error('PATCH /participants/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
