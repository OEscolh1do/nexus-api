import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateSync } from '../../middlewares/zodMiddleware';
import { authenticateToken, requireAdmin } from '../../middlewares/authMiddleware';
import { 
  LoginSchema, 
  RegisterSchema, 
  UpdateProfileSchema, 
  AdminUpdateUserSchema 
} from './auth.schema';

const router = Router();
const controller = new AuthController();

// Public Routes
router.post('/login', validateSync(LoginSchema), controller.login);
router.post('/register', validateSync(RegisterSchema), controller.register);

// Private Routes (Logged In)
router.post('/logout', controller.logout);
router.get('/me', authenticateToken, controller.me);
router.put('/profile', authenticateToken, validateSync(UpdateProfileSchema), controller.updateProfile);

// Admin Routes
router.get('/users', authenticateToken, requireAdmin, controller.listUsers);
router.put('/users/:id', authenticateToken, requireAdmin, validateSync(AdminUpdateUserSchema), controller.updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, controller.deleteUser);

export const authRoutes = router;
