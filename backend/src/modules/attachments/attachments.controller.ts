import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

export class AttachmentController {
  
  // --- UPLOAD ATTACHMENT (Project or Client) ---
  async uploadAttachment(req: Request, res: Response) {
    const { id } = req.params; // Can be projectId or clientId depending on route? 
    // Actually legacy had specific routes: /api/projects/:id/attachments and /api/clients/:id/attachments.
    // We can handle both via route config or generic param.
    // Let's assume the router passes the type context or we check route path?
    // Better: Helper methods or check req.baseUrl/route.
    
    // Simplest: Check query param or route param if we unify.
    // But let's separate methods for clarity if routes are distinct.
    return res.status(500).json({ error: 'Not implemented directly. Use specific methods.' });
  }

  async uploadProjectAttachment(req: Request, res: Response) {
    const { id } = req.params as { id: string }; // ProjectId
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Sem arquivo.' });

    try {
      const att = await prisma.attachment.create({
        data: {
          fileName: file.originalname,
          filePath: file.filename, // Multer generated
          fileType: file.mimetype,
          projectId: id,
        },
      });
      return res.json(att);
    } catch (error) {
      console.error('Upload Project Err:', error);
      return res.status(500).json({ error: 'Erro upload' });
    }
  }

  async uploadClientAttachment(req: Request, res: Response) {
    const { id } = req.params as { id: string }; // ClientId
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Sem arquivo.' });

    try {
      const att = await prisma.attachment.create({
        data: {
          fileName: file.originalname,
          filePath: file.filename,
          fileType: file.mimetype,
          clientId: id,
        },
      });
      return res.json(att);
    } catch (error) {
       console.error('Upload Client Err:', error);
       return res.status(500).json({ error: 'Erro upload anexo cliente.' });
    }
  }

  // --- GET ATTACHMENTS ---
  async getProjectAttachments(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    try {
      const files = await prisma.attachment.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(files);
    } catch (error) {
      return res.status(500).json({ error: 'Erro lista anexos' });
    }
  }

  // --- DELETE ATTACHMENT ---
  async deleteAttachment(req: Request, res: Response) {
    const { id } = req.params as { id: string }; // Attachment ID
    try {
      const att = await prisma.attachment.findUnique({ where: { id } });
      if (att) {
         const uploadDir = path.join(__dirname, '../../../uploads'); 
         // Assuming uploads is at root/uploads. 
         // Verify relative path. __dirname is src/modules/attachments.
         // ../../../uploads -> backend/uploads. Correct.
         
         const p = path.join(uploadDir, att.filePath);
         if (fs.existsSync(p)) {
           fs.unlink(p, (err) => {
             if (err) console.error('Failed to unlink:', err);
           });
         }
         
         await prisma.attachment.delete({ where: { id } });
      }
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro delete' });
    }
  }
}
