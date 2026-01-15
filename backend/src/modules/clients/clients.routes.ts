import { Router } from 'express';
import { ClientController } from './clients.controller';
import { validateSync } from '../../middlewares/zodMiddleware';
import { authenticateToken } from '../../middlewares/authMiddleware';
import { UpdateClientSchema } from './clients.schema';

const router = Router();
const controller = new ClientController();

router.use(authenticateToken); // Protection for all routes

router.get('/', controller.getAllClients);
router.get('/:id', controller.getClientById);
router.put('/:id', validateSync(UpdateClientSchema), controller.updateClient);
router.delete('/:id', controller.deleteClient);

export const clientRoutes = router;
