import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheGet, cacheSet } from '../cache.js';

const CACHE_TTL = 10; // seconds

const router = Router();

// GET /map/teams — returns open teams with lat/lng and looking participants with lat/lng
router.get('/teams', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'map:teams';
    const cached = await cacheGet<{ teams: unknown[]; participants: unknown[] }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const participantsResult = await query(
      `SELECT id, name, skills, roles, lat, lng
       FROM participants
       WHERE status = 'looking'
         AND lat IS NOT NULL
         AND lng IS NOT NULL`
    );

    const teamsResult = await query(
      `SELECT t.id, t.name, t.project_idea, t.needed_roles, t.lat, t.lng,
              p.id AS captain_id, p.name AS captain_name
       FROM teams t
       JOIN participants p ON p.id = t.captain_id
       WHERE t.status = 'open'
         AND t.lat IS NOT NULL
         AND t.lng IS NOT NULL`
    );

    const teams = teamsResult.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      project_idea: row.project_idea as string | null,
      needed_roles: row.needed_roles as string[],
      lat: row.lat as number,
      lng: row.lng as number,
      captain: {
        id: row.captain_id as string,
        name: row.captain_name as string,
      },
    }));

    const participants = participantsResult.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      skills: row.skills as string[],
      roles: row.roles as string[],
      lat: row.lat as number,
      lng: row.lng as number,
    }));

    const body = { teams, participants };
    await cacheSet(cacheKey, body, CACHE_TTL);
    res.json(body);
  } catch (err) {
    console.error('GET /map/teams error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /map/mentors — protected, returns all mentors with lat/lng for map initial load
// Supports optional ?expertise=<keyword> for case-insensitive substring filtering
router.get('/mentors', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const expertiseFilter = typeof req.query.expertise === 'string' ? req.query.expertise.trim() : '';
    const cacheKey = expertiseFilter ? `map:mentors:${expertiseFilter.toLowerCase()}` : 'map:mentors';
    const cached = await cacheGet<{ mentors: unknown[] }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const result = await query(
      `SELECT id, name, expertise, experience, status, lat, lng
       FROM mentors
       WHERE lat IS NOT NULL AND lng IS NOT NULL`
    );

    let mentors = result.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      expertise: row.expertise as string[],
      experience: row.experience as string | null,
      status: row.status as 'available' | 'busy' | 'away',
      lat: row.lat as number,
      lng: row.lng as number,
    }));

    if (expertiseFilter) {
      const lowerFilter = expertiseFilter.toLowerCase();
      mentors = mentors.filter((m) =>
        m.expertise.some((e) => e.toLowerCase().includes(lowerFilter))
      );
    }

    const body = { mentors };
    await cacheSet(cacheKey, body, CACHE_TTL);
    res.json(body);
  } catch (err) {
    console.error('GET /map/mentors error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
