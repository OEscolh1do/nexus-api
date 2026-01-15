import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateToken } from '../../middlewares/authMiddleware';

const router = Router();
const controller = new DashboardController();

// Only admin can access dashboard logic in legacy code? Yes, checked in controller.
router.get('/metrics', authenticateToken, controller.getMetrics);

export const dashboardRoutes = router;
