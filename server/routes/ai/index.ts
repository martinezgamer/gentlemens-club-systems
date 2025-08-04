import { Router } from 'express';
import { storage } from '../../storage';
import * as aiTaskService from '../../ai-task-service';
import { generateSmartPlaylist } from '../../ai-music-service';
import type { Response } from 'express';

const router = Router();

router.post('/tasks/suggestions', async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const { clubLocation } = req.body as { clubLocation?: string };
    const recentActivity = await storage.getRecentActivity(userId);
    const suggestions = await aiTaskService.generateTaskSuggestions(
      clubLocation || user?.clubLocation || 'wiggles_gentlemens_club',
      recentActivity
    );
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate task suggestions' });
  }
});

router.post('/music', async (req, res) => {
  try {
    const result = await generateSmartPlaylist(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate playlist' });
  }
});

export default router;
