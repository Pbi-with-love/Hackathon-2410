import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, getClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const matchRouter = Router();

const InviteBodySchema = z.object({
  participantId: z.string().uuid(),
});

const RequestBodySchema = z.object({
  teamId: z.string().uuid(),
});

const RespondBodySchema = z.object({
  action: z.enum(['accept', 'decline']),
});

// POST /match/invite — captain invites a participant
matchRouter.post('/invite', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parse = InviteBodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
    return;
  }

  const { participantId } = parse.data;
  const userId = req.user!.userId;

  // Verify the caller is a captain of a team
  const teamResult = await query(
    'SELECT id FROM teams WHERE captain_id = $1 LIMIT 1',
    [userId]
  );

  if (teamResult.rowCount === 0) {
    res.status(403).json({ error: 'Only team captains can invite participants' });
    return;
  }

  const teamId = (teamResult.rows[0] as { id: string }).id;

  // Check no existing open match between this participant+team
  const existing = await query(
    `SELECT id FROM matches
     WHERE participant_id = $1 AND team_id = $2
       AND state IN ('suggested', 'invited', 'requested', 'accepted')`,
    [participantId, teamId]
  );

  if ((existing.rowCount ?? 0) > 0) {
    res.status(409).json({ error: 'An open match already exists between this participant and team' });
    return;
  }

  // Insert match
  const result = await query(
    `INSERT INTO matches (participant_id, team_id, direction, state, score, reasons)
     VALUES ($1, $2, 'team_to_participant', 'invited', 0, '[]')
     RETURNING *`,
    [participantId, teamId]
  );

  res.status(201).json(result.rows[0]);
});

// POST /match/request — participant requests to join a team
matchRouter.post('/request', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parse = RequestBodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
    return;
  }

  const { teamId } = parse.data;
  const participantId = req.user!.userId;

  // Check no existing open match
  const existing = await query(
    `SELECT id FROM matches
     WHERE participant_id = $1 AND team_id = $2
       AND state IN ('suggested', 'invited', 'requested', 'accepted')`,
    [participantId, teamId]
  );

  if ((existing.rowCount ?? 0) > 0) {
    res.status(409).json({ error: 'An open match already exists between you and this team' });
    return;
  }

  const result = await query(
    `INSERT INTO matches (participant_id, team_id, direction, state, score, reasons)
     VALUES ($1, $2, 'participant_to_team', 'requested', 0, '[]')
     RETURNING *`,
    [participantId, teamId]
  );

  res.status(201).json(result.rows[0]);
});

// POST /match/:id/respond — accept or decline a match
matchRouter.post('/:id/respond', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const matchId = req.params.id;
  const parse = RespondBodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
    return;
  }

  const { action } = parse.data;
  const userId = req.user!.userId;

  // Fetch the match
  const matchResult = await query(
    `SELECT m.*, t.captain_id FROM matches m
     JOIN teams t ON t.id = m.team_id
     WHERE m.id = $1`,
    [matchId]
  );

  if (matchResult.rowCount === 0) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  interface MatchRow {
    id: string;
    participant_id: string;
    team_id: string;
    direction: string;
    state: string;
    score: number;
    reasons: unknown[];
    captain_id: string;
    created_at: string;
  }

  const match = matchResult.rows[0] as MatchRow;

  // Verify the responding user is the correct party
  // invited (team_to_participant) → participant responds
  // requested (participant_to_team) → captain responds
  if (match.state === 'invited') {
    if (match.participant_id !== userId) {
      res.status(403).json({ error: 'Only the invited participant can respond to this match' });
      return;
    }
  } else if (match.state === 'requested') {
    if (match.captain_id !== userId) {
      res.status(403).json({ error: 'Only the team captain can respond to this match' });
      return;
    }
  } else {
    res.status(409).json({ error: `Match is in state '${match.state}' and cannot be responded to` });
    return;
  }

  if (action === 'decline') {
    const updated = await query(
      `UPDATE matches SET state = 'declined' WHERE id = $1 RETURNING *`,
      [matchId]
    );
    res.json(updated.rows[0]);
    return;
  }

  // action === 'accept'
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Set match state to accepted
    await client.query(
      `UPDATE matches SET state = 'accepted' WHERE id = $1`,
      [matchId]
    );

    // Set participant status to in_team
    await client.query(
      `UPDATE participants SET status = 'in_team' WHERE id = $1`,
      [match.participant_id]
    );

    // Insert team_members row
    await client.query(
      `INSERT INTO team_members (team_id, participant_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [match.team_id, match.participant_id]
    );

    // Expire all other open matches for this participant
    await client.query(
      `UPDATE matches SET state = 'expired'
       WHERE participant_id = $1
         AND id != $2
         AND state IN ('suggested', 'invited', 'requested')`,
      [match.participant_id, matchId]
    );

    await client.query('COMMIT');

    const updatedMatch = await query(
      `SELECT * FROM matches WHERE id = $1`,
      [matchId]
    );
    res.json(updatedMatch.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error accepting match:', err);
    res.status(500).json({ error: 'Failed to accept match' });
  } finally {
    client.release();
  }
});

// GET /matches — return all pending matches for the authenticated user
matchRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const result = await query(
    `SELECT
       m.id,
       m.participant_id,
       m.team_id,
       m.direction,
       m.state,
       m.score,
       m.reasons,
       m.created_at,
       p.name AS participant_name,
       p.roles AS participant_roles,
       t.name AS team_name,
       t.project_idea AS team_project_idea,
       t.captain_id
     FROM matches m
     JOIN participants p ON p.id = m.participant_id
     JOIN teams t ON t.id = m.team_id
     WHERE (m.participant_id = $1 OR t.captain_id = $1)
       AND m.state IN ('invited', 'requested')
     ORDER BY m.created_at DESC`,
    [userId]
  );

  res.json(result.rows);
});

export default matchRouter;
