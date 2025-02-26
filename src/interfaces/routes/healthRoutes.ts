import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

export const healthRoutes = (): Router => {
  const router = Router();
  const healthController = new HealthController();

  router.get('/', healthController.check.bind(healthController));

  return router;
}; 