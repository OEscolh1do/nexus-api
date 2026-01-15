import { Router } from 'express';
import { ProjectController } from './projects.controller';
import { validateSync } from '../../middlewares/zodMiddleware';
import { authenticateToken } from '../../middlewares/authMiddleware';
import { 
  CreateLeadSchema, 
  UpdateProjectSchema, 
  AddActivitySchema, 
  AddUnitSchema 
} from './projects.schema';

const router = Router();
const controller = new ProjectController();

router.use(authenticateToken);

// Lead / Project
router.post('/leads', validateSync(CreateLeadSchema), controller.createLead); // Create Lead
router.get('/projects', controller.getProjects);
router.get('/projects/:id', controller.getProjectById);
router.put('/projects/:id', validateSync(UpdateProjectSchema), controller.updateProject);
router.delete('/projects/:id', controller.deleteProject);

// Activities
router.post('/projects/:id/activities', validateSync(AddActivitySchema), controller.addActivity);

// Units
router.post('/projects/:id/units', validateSync(AddUnitSchema), controller.addUnit);
router.delete('/units/:unitId', controller.deleteUnit); // Note: Global path /api/units/:unitId in legacy

export const projectRoutes = router;
