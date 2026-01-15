import { Router } from 'express';
import { MobileController } from './mobile.controller';

const router = Router();
const controller = new MobileController();

router.post('/simulate', controller.runSimulation);
router.post('/lead', controller.sendLead);

export const mobileRoutes = router;
