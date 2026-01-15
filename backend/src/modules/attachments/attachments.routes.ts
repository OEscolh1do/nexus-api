import { Router } from 'express';
import { AttachmentController } from './attachments.controller';
import { authenticateToken } from '../../middlewares/authMiddleware';
import { uploadConfig } from '../../config/upload';

const router = Router();
const controller = new AttachmentController();

router.use(authenticateToken);

// Project Attachments
router.post('/projects/:id/attachments', uploadConfig.single('file'), controller.uploadProjectAttachment);
router.get('/projects/:id/attachments', controller.getProjectAttachments);

// Client Attachments
router.post('/clients/:id/attachments', uploadConfig.single('file'), controller.uploadClientAttachment);

// General Delete
router.delete('/attachments/:id', controller.deleteAttachment);

export const attachmentRoutes = router;
