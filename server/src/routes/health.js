import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * For Railway / load balancers. Returns 200 when server is up.
 * Response shape is consistent for future DB checks.
 */
router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'eazybookz',
    timestamp: new Date().toISOString(),
  });
});

export const healthRouter = router;
