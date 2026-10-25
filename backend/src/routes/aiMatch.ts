import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';
import { rankTeamsForParticipant } from '../services/matchingService.js';

const router = Router();

const N8N_MATCH_URL = process.env.N8N_MATCH_URL || 'http://localhost:5678/webhook/match-teams';
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || '';
const TIMEOUT_MS = 12_000;

/**
 * POST /api/match
 *
 * Proxies to the n8n matching webhook. On timeout/error, falls back to
 * the existing keyword-based matcher.
 */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const {
    prompt = '',
    profile = null,
    target = 'teams',
    exclude_ids = [],
    feedback = {},
    limit = 5,
  } = req.body as {
    prompt?: string;
    profile?: unknown;
    target?: string;
    exclude_ids?: string[];
    feedback?: { weights?: Record<string, number>; declined?: string[] };
    limit?: number;
  };

  if (!prompt && !profile) {
    res.status(400).json({ error: 'Either prompt or profile is required' });
    return;
  }

  const startTime = Date.now();

  // Try n8n webhook
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (N8N_WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = N8N_WEBHOOK_SECRET;
    }

    const n8nRes = await fetch(N8N_MATCH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, profile, target, exclude_ids, feedback, limit }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!n8nRes.ok) {
      const text = await n8nRes.text();
      console.error(`[ai-match] n8n returned ${n8nRes.status}: ${text}`);
      throw new Error(`n8n error ${n8nRes.status}`);
    }

    const data = (await n8nRes.json()) as Record<string, unknown>;
    const ms = Date.now() - startTime;
    console.log(`[ai-match] n8n responded in ${ms}ms, results: ${Array.isArray(data.results) ? (data.results as unknown[]).length : 0}`);

    // Ensure meta.ms is set
    if (data.meta && typeof data.meta === 'object') {
      (data.meta as Record<string, unknown>).ms = ms;
    }

    // If n8n returned results, send them
    const results = data.results as unknown[] | undefined;
    if (results && results.length > 0) {
      res.json(data);
      return;
    }

    // n8n returned 0 results — fall through to keyword matcher
    console.warn(`[ai-match] n8n returned 0 results, falling back to keyword matcher`);
  } catch (err) {
    const ms = Date.now() - startTime;
    const reason = err instanceof Error ? err.message : 'unknown';
    console.warn(`[ai-match] n8n failed after ${ms}ms (${reason}), falling back to keyword matcher`);
  }

  // Fallback: use existing keyword-based matcher
  try {
    const participantResult = await query(
      'SELECT id, roles, skills FROM participants WHERE id = $1',
      [userId],
    );

    if (participantResult.rowCount === 0) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    const participant = participantResult.rows[0] as {
      id: string;
      roles: string[];
      skills: Array<string | { name: string }>;
    };

    const teamsResult = await query(
      `SELECT id, name, project_idea, needed_roles, status, challenge, goals,
              lat::float AS lat, lng::float AS lng
       FROM teams WHERE status = 'open'`,
    );

    const suggestions = rankTeamsForParticipant(
      participant,
      teamsResult.rows as Array<{
        id: string;
        name: string;
        project_idea: string;
        needed_roles: string[];
        status: string;
        lat: number | null;
        lng: number | null;
      }>,
    );

    // Map to the §4 contract shape
    const results = suggestions.slice(0, limit).map((s) => ({
      id: s.teamId,
      name: s.teamName,
      challenge: '',
      zone: null,
      members: 0,
      max_size: 5,
      needed_roles: s.neededRoles,
      fit: Math.round(s.score * 100),
      factors: { interest: 0.5, role: s.score, avail: 1.0 },
      reason: s.reasons[0] || 'This team could use your skills.',
    }));

    const fallbackProfile = {
      idea: null,
      interests: [],
      skills: participant.skills?.map((s) => (typeof s === 'string' ? s : s.name)) || [],
      roles: participant.roles || [],
      availability: null,
      synonyms: [],
    };

    res.json({
      profile: fallbackProfile,
      results,
      meta: {
        candidates: teamsResult.rowCount,
        weights: { interest: 0.35, role: 0.35, avail: 0.30 },
        ms: Date.now() - startTime,
        fallback: true,
      },
    });
  } catch (fallbackErr) {
    console.error('[ai-match] fallback also failed:', fallbackErr);
    res.status(500).json({ error: 'Matching failed', message: 'Both AI and fallback matchers failed' });
  }
});

export default router;
