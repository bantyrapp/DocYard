import { Router } from 'express';
import { getStats } from '../lib/stats.js';

const router = Router();

function checkAdminKey(req) {
  const key = req.query.key || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  const secret = process.env.ADMIN_SECRET;
  return secret && key && key === secret;
}

/** GET /api/admin/stats?key=YOUR_ADMIN_SECRET */
router.get('/stats', (req, res) => {
  if (!checkAdminKey(req)) {
    return res.status(401).json({ error: 'Invalid or missing admin key' });
  }
  try {
    const stats = getStats();
    return res.json({
      exportCount: stats.exportCount || 0,
      recent: (stats.recent || []).slice(0, 50),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to read stats' });
  }
});

export const adminRouter = router;
