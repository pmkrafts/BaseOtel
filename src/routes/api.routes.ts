import { Router } from 'express';

const router = Router();

router.get('/api/data', (_req, res) => {
  res.status(200).json({
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
