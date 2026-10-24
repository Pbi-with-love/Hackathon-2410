import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';
import {
  rankTeamsForParticipant,
  rankParticipantsForTeam,
} from '../services/matchingService.js';

const suggestionsRouter = Router();

// GET /suggestions/teams/:participantId
suggestionsRouter.get(
  '/teams/:participantId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { participantId } = req.params;

    const participantResult = await query(
      'SELECT id, roles, skills FROM participants WHERE id = $1',
      [participantId]
    );

    if (participantResult.rowCount === 0) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    const participant = participantResult.rows[0] as {
      id: string;
      roles: string[];
      skills: Array<{ name: string }>;
    };

    const teamsResult = await query(
      `SELECT id, name, project_idea, needed_roles, status,
              lat::float AS lat, lng::float AS lng
       FROM teams
       WHERE status = 'open'`
    );

    const suggestions = rankTeamsForParticipant(participant, teamsResult.rows as Array<{
      id: string;
      name: string;
      project_idea: string;
      needed_roles: string[];
      status: string;
      lat: number | null;
      lng: number | null;
    }>);

    res.json({ suggestions });
  }
);

// GET /suggestions/participants/:teamId
suggestionsRouter.get(
  '/participants/:teamId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;

    const teamResult = await query(
      'SELECT id, needed_roles FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamResult.rowCount === 0) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const team = teamResult.rows[0] as {
      id: string;
      needed_roles: string[];
    };

    const participantsResult = await query(
      `SELECT id, name, skills, roles, status,
              lat::float AS lat, lng::float AS lng
       FROM participants
       WHERE status = 'looking'`
    );

    const suggestions = rankParticipantsForTeam(team, participantsResult.rows as Array<{
      id: string;
      name: string;
      skills: unknown;
      roles: string[];
      status: string;
      lat: number | null;
      lng: number | null;
    }>);

    res.json({ suggestions });
  }
);

export default suggestionsRouter;
