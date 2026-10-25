import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, getClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheInvalidate } from '../cache.js';

const router = Router();

const CreateTeamSchema = z.object({
  name: z.string().min(1),
  challenge: z.string().optional(),
  project_idea: z.string().optional(),
  goals: z.string().optional(),
  needed_roles: z.array(z.string()).optional(),
});

const UpdateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  project_idea: z.string().optional(),
  goals: z.string().optional(),
  needed_roles: z.array(z.string()).optional(),
  status: z.enum(['open', 'closed']).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

// POST /teams
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (req.user?.userType !== 'participant') {
    res.status(403).json({ error: 'Only participants can create teams' });
    return;
  }

  const parsed = CreateTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  const { name, challenge, project_idea, goals, needed_roles } = parsed.data;
  const captainId = req.user.userId;

  try {
    const result = await query(
      `INSERT INTO teams (name, captain_id, challenge, project_idea, goals, needed_roles)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, captainId, challenge ?? null, project_idea ?? null, goals ?? null, needed_roles ?? []]
    );

    const team = result.rows[0];

    // Also add captain as a team member
    await query(
      `INSERT INTO team_members (team_id, participant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [team.id, captainId]
    );

    // Update captain's status to in_team
    await query(
      `UPDATE participants SET status = 'in_team' WHERE id = $1`,
      [captainId]
    );

    res.status(201).json({ team });
  } catch (err) {
    console.error('POST /teams error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /teams — returns teams where the current user is captain
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const captainId = req.user?.userId;
  try {
    const result = await query(
      `SELECT id, name, captain_id, status FROM teams WHERE captain_id = $1`,
      [captainId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /teams error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /teams/mine — returns the current user's team, members, and pending match count
router.get('/mine', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  try {
    // Look up team: either as member or as captain
    const memberRow = await query(
      `SELECT team_id FROM team_members WHERE participant_id = $1
       UNION
       SELECT id AS team_id FROM teams WHERE captain_id = $1
       LIMIT 1`,
      [userId]
    );

    if (memberRow.rows.length === 0) {
      res.json({ team: null, members: [], pendingCount: 0 });
      return;
    }

    const teamId = memberRow.rows[0].team_id;

    // Get team details
    const teamResult = await query(
      `SELECT t.*, p.name as captain_name, p.email as captain_email
       FROM teams t
       LEFT JOIN participants p ON p.id = t.captain_id
       WHERE t.id = $1`,
      [teamId]
    );

    // Get all members
    const membersResult = await query(
      `SELECT p.id, p.name, p.email, p.bio, p.skills, p.roles, p.interests, p.status, p.lat, p.lng, p.created_at, tm.joined_at
       FROM team_members tm
       JOIN participants p ON p.id = tm.participant_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );

    // Count pending matches (invited or requested)
    const pendingResult = await query(
      `SELECT COUNT(*) as cnt FROM matches
       WHERE team_id = $1 AND state IN ('invited', 'requested')`,
      [teamId]
    );

    res.json({
      team: teamResult.rows[0],
      members: membersResult.rows,
      pendingCount: parseInt(pendingResult.rows[0].cnt as string),
    });
  } catch (err) {
    console.error('GET /teams/mine error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /teams/:id
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const cacheKey = `team:${id}`;

  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) {
    console.debug(`[cache] hit ${cacheKey}`);
    res.json({ team: cached });
    return;
  }
  console.debug(`[cache] miss ${cacheKey}`);

  try {
    const result = await query(
      `SELECT t.*, p.name as captain_name, p.email as captain_email
       FROM teams t
       LEFT JOIN participants p ON p.id = t.captain_id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    await cacheSet(cacheKey, result.rows[0], 300);
    res.json({ team: result.rows[0] });
  } catch (err) {
    console.error('GET /teams/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /teams/:id
router.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };

  try {
    // Check captain
    const teamResult = await query(`SELECT captain_id FROM teams WHERE id = $1`, [id]);
    if (teamResult.rows.length === 0) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (teamResult.rows[0].captain_id !== req.user?.userId) {
      res.status(403).json({ error: 'Forbidden: only the captain can update the team' });
      return;
    }

    const parsed = UpdateTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    const data = parsed.data;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIdx++}`);
      values.push(data.name);
    }
    if (data.project_idea !== undefined) {
      setClauses.push(`project_idea = $${paramIdx++}`);
      values.push(data.project_idea);
    }
    if (data.goals !== undefined) {
      setClauses.push(`goals = $${paramIdx++}`);
      values.push(data.goals);
    }
    if (data.needed_roles !== undefined) {
      setClauses.push(`needed_roles = $${paramIdx++}::text[]`);
      values.push(data.needed_roles);
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

    const result = await query(
      `UPDATE teams SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    await cacheInvalidate(`team:${id}`, `team:${id}:members`);
    res.json({ team: result.rows[0] });
  } catch (err) {
    console.error('PATCH /teams/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /teams/:id/members
router.get('/:id/members', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const cacheKey = `team:${id}:members`;

  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) {
    console.debug(`[cache] hit ${cacheKey}`);
    res.json({ members: cached });
    return;
  }
  console.debug(`[cache] miss ${cacheKey}`);

  try {
    const teamResult = await query(`SELECT id FROM teams WHERE id = $1`, [id]);
    if (teamResult.rows.length === 0) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const result = await query(
      `SELECT p.id, p.name, p.email, p.bio, p.skills, p.roles, p.interests, p.status, p.lat, p.lng, p.created_at, tm.joined_at
       FROM team_members tm
       JOIN participants p ON p.id = tm.participant_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [id]
    );

    await cacheSet(cacheKey, result.rows, 300);
    res.json({ members: result.rows });
  } catch (err) {
    console.error('GET /teams/:id/members error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /teams/:id/leave — current user leaves the team
router.post('/:id/leave', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const userId = req.user?.userId;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Verify the user is a member of this team
    const memberCheck = await client.query(
      `SELECT participant_id FROM team_members WHERE team_id = $1 AND participant_id = $2`,
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'You are not a member of this team' });
      return;
    }

    // Check if user is captain
    const teamResult = await client.query(
      `SELECT captain_id FROM teams WHERE id = $1`,
      [id]
    );

    if (teamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const isCaptain = teamResult.rows[0].captain_id === userId;
    let newCaptainId: string | null = null;
    let dissolved = false;

    if (isCaptain) {
      // Find the next oldest member (excluding current user)
      const nextMember = await client.query(
        `SELECT participant_id FROM team_members
         WHERE team_id = $1 AND participant_id != $2
         ORDER BY joined_at ASC
         LIMIT 1`,
        [id, userId]
      );

      if (nextMember.rows.length > 0) {
        // Transfer captaincy
        newCaptainId = nextMember.rows[0].participant_id;
        await client.query(
          `UPDATE teams SET captain_id = $1 WHERE id = $2`,
          [newCaptainId, id]
        );
      } else {
        // No other members — dissolve the team
        dissolved = true;
        await client.query(`DELETE FROM teams WHERE id = $1`, [id]);
      }
    }

    // Remove the user from team_members
    await client.query(
      `DELETE FROM team_members WHERE team_id = $1 AND participant_id = $2`,
      [id, userId]
    );

    // Set participant status back to 'looking'
    await client.query(
      `UPDATE participants SET status = 'looking' WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    // Invalidate cache
    await cacheInvalidate(`team:${id}`, `team:${id}:members`);

    if (dissolved) {
      res.json({ success: true, dissolved: true });
    } else {
      res.json({ success: true, newCaptainId });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /teams/:id/leave error', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /teams/:id/members/:pid — captain removes a member
router.delete('/:id/members/:pid', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id, pid } = req.params as { id: string; pid: string };
  const userId = req.user?.userId;

  try {
    // Verify req.user is captain of this team
    const teamResult = await query(
      `SELECT captain_id, status FROM teams WHERE id = $1`,
      [id]
    );

    if (teamResult.rows.length === 0) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (teamResult.rows[0].captain_id !== userId) {
      res.status(403).json({ error: 'Only the captain can remove members' });
      return;
    }

    // Cannot remove self (use /leave instead)
    if (pid === userId) {
      res.status(400).json({ error: 'Cannot remove yourself; use /leave instead' });
      return;
    }

    // Verify the participant is actually a member
    const memberCheck = await query(
      `SELECT participant_id FROM team_members WHERE team_id = $1 AND participant_id = $2`,
      [id, pid]
    );

    if (memberCheck.rows.length === 0) {
      res.status(404).json({ error: 'Participant is not a member of this team' });
      return;
    }

    // Remove participant from team_members
    await query(
      `DELETE FROM team_members WHERE team_id = $1 AND participant_id = $2`,
      [id, pid]
    );

    // Set participant status back to 'looking'
    await query(
      `UPDATE participants SET status = 'looking' WHERE id = $1`,
      [pid]
    );

    // Expire any accepted match between this participant and team
    await query(
      `UPDATE matches SET state = 'expired'
       WHERE participant_id = $1 AND team_id = $2 AND state = 'accepted'`,
      [pid, id]
    );

    // If team is now under max_size (5) and status='closed', reopen it
    if (teamResult.rows[0].status === 'closed') {
      const countResult = await query(
        `SELECT COUNT(*) as cnt FROM team_members WHERE team_id = $1`,
        [id]
      );
      if (parseInt(countResult.rows[0].cnt as string) < 5) {
        await query(
          `UPDATE teams SET status = 'open' WHERE id = $1`,
          [id]
        );
      }
    }

    // Invalidate cache
    await cacheInvalidate(`team:${id}`, `team:${id}:members`);

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /teams/:id/members/:pid error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
