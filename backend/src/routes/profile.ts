import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { extractProfile } from '../services/profileExtractor.js';

const router = Router();

const ExtractProfileSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
});

// POST /profile/extract — extract a structured profile from a free-text prompt
router.post('/extract', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = ExtractProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  try {
    const profile = await extractProfile(parsed.data.prompt);
    res.json({ profile });
  } catch (err) {
    console.error('POST /profile/extract error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
