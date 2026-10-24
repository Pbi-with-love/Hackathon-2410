import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const UpdateMentorSchema = z.object({
  expertise: z.array(z.string()).optional(),
  experience: z.string().optional(),
  status: z.enum(['available', 'busy', 'away']).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

// GET /mentors/:id
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };

  try {
    const result = await query(
      `SELECT id, name, email, expertise, experience, status, lat, lng, created_at
       FROM mentors WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Mentor not found' });
      return;
    }

    res.json({ mentor: result.rows[0] });
  } catch (err) {
    console.error('GET /mentors/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /mentors/:id
router.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };

  if (req.user?.userId !== id) {
    res.status(403).json({ error: 'Forbidden: can only update your own profile' });
    return;
  }

  const parsed = UpdateMentorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (data.expertise !== undefined) {
    setClauses.push(`expertise = $${paramIdx++}::text[]`);
    values.push(data.expertise);
  }
  if (data.experience !== undefined) {
    setClauses.push(`experience = $${paramIdx++}`);
    values.push(data.experience);
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
      `UPDATE mentors SET ${setClauses.join(', ')}
       WHERE id = $${paramIdx}
       RETURNING id, name, email, expertise, experience, status, lat, lng, created_at`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Mentor not found' });
      return;
    }

    res.json({ mentor: result.rows[0] });
  } catch (err) {
    console.error('PATCH /mentors/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
