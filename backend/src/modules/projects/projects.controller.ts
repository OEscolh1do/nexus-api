import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export class ProjectController {
  
  // --- CREATE LEAD (Complex Transaction) ---
  async createLead(req: Request, res: Response) {
    const { clientId, name, email, phone, description } = req.body;
    const userId = req.user?.id;

    try {
      const result = await prisma.$transaction(async (tx) => {
        let finalClientId = clientId;
        let clientNameForTitle = name;

        // 1. Handle Client (Find or Create)
        if (!finalClientId) {
          // Check email uniqueness if provided
          if (email) {
            const existing = await tx.client.findFirst({ where: { email } });
            if (existing) throw new Error('EMAIL_EXISTS');
          }

          const newClient = await tx.client.create({
            data: { name, email, phone },
          });
          finalClientId = newClient.id;
          clientNameForTitle = newClient.name;
        } else {
          const existingClient = await tx.client.findUnique({ where: { id: clientId } });
          if (!existingClient) throw new Error('CLIENT_NOT_FOUND');
          clientNameForTitle = existingClient.name;
        }

        // 2. Calculate Rank
        const maxRank = await tx.project.aggregate({ _max: { rank: true } });
        const nextRank = (maxRank._max.rank || 0) + 1000;

        // 3. Create Project
        const newProject = await tx.project.create({
          data: {
            title: `Projeto Lead - ${clientNameForTitle}`,
            description: description || null,
            clientId: finalClientId,
            status: 'CONTACT',
            rank: nextRank,
            activities: {
              create: {
                type: 'SYSTEM',
                action: 'Lead Criado',
                userId,
              },
            },
          },
        });

        return { client: { id: finalClientId }, project: newProject };
      });

      return res.status(201).json(result);

    } catch (error: any) {
      if (error.message === 'EMAIL_EXISTS') return res.status(409).json({ error: 'Já existe um cliente com este e-mail.' });
      if (error.message === 'CLIENT_NOT_FOUND') return res.status(404).json({ error: 'Cliente não encontrado.' });
      
      console.error('[CreateLead] Error:', error);
      return res.status(500).json({ error: 'Erro ao processar Lead.' });
    }
  }

  // --- LIST PROJECTS ---
  async getProjects(req: Request, res: Response) {
    try {
      const projects = await prisma.project.findMany({
        include: { client: true },
        orderBy: [{ rank: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json(projects);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar projetos' });
    }
  }

  // --- GET PROJECT BY ID ---
  async getProjectById(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: true,
          activities: { orderBy: { createdAt: 'desc' }, include: { user: true } },
          units: true,
          attachments: true,
        },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
      return res.json(project);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar projeto único' });
    }
  }

  // --- UPDATE PROJECT ---
  async updateProject(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const { status, ...data } = req.body;
    const userId = req.user?.id;

    try {
      const currentProject = await prisma.project.findUnique({ where: { id } });
      if (!currentProject) return res.status(404).json({ error: 'Projeto não encontrado' });

      const updateData: Prisma.ProjectUpdateInput = { ...data };

      // Status Change Logic
      if (status && status !== currentProject.status) {
        updateData.status = status;
        updateData.activities = {
          create: {
            type: 'SYSTEM',
            action: 'Status Alterado',
            details: `De ${currentProject.status} para ${status}`,
            userId,
          },
        };
      }

      const updated = await prisma.project.update({
        where: { id },
        data: updateData,
      });

      return res.json(updated);
    } catch (error) {
      console.error('[UpdateProject] Error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar projeto' });
    }
  }

  // --- DELETE PROJECT (Transactional) ---
  async deleteProject(req: Request, res: Response) {
    const { id } = req.params as { id: string };

    try {
      await prisma.$transaction(async (tx) => {
        await tx.activityLog.deleteMany({ where: { projectId: id } });
        await tx.consumerUnit.deleteMany({ where: { projectId: id } });
        await tx.attachment.deleteMany({ where: { projectId: id } });
        await tx.project.delete({ where: { id } });
      });

      return res.json({ success: true, message: 'Projeto excluído com sucesso.' });
    } catch (error) {
      console.error('[DeleteProject] Error:', error);
      return res.status(500).json({ error: 'Não foi possível excluir o projeto.' });
    }
  }

  // --- ACTIVITIES (Notes) ---
  async addActivity(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const { note } = req.body;
    const userId = req.user?.id;

    try {
      const log = await prisma.activityLog.create({
        data: {
          projectId: id,
          type: 'NOTE',
          action: 'Nota',
          details: note,
          userId,
        },
      });
      return res.json(log);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao adicionar nota' });
    }
  }

  // --- UNITS ---
  async addUnit(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const { isGenerator, ...unitData } = req.body;

    try {
      await prisma.$transaction(async (tx) => {
         // If generic generator setting, clear others
         if (isGenerator) {
            await tx.consumerUnit.updateMany({
                where: { projectId: id },
                data: { isGenerator: false }
            });
         }
         
         await tx.consumerUnit.create({
            data: {
                ...unitData,
                isGenerator,
                projectId: id
            }
         });
      });
      
      // Return updated list or the unit? Original returned the unit. 
      // We'll return success to keep it simple or fetch the unit back if needed.
      // But let's return the created unit actually.
      const createdUnit = await prisma.consumerUnit.findFirst({ where: { projectId: id }, orderBy: { id: 'desc' } }); // Hacky
      return res.json(createdUnit);
    } catch (error) {
       console.error('[AddUnit] Error:', error);
       return res.status(500).json({ error: 'Erro ao adicionar unidade.' });
    }
  }
  
  async deleteUnit(req: Request, res: Response) {
     const { unitId } = req.params as { unitId: string };
     try {
        await prisma.consumerUnit.delete({ where: { id: unitId } });
        return res.json({ success: true });
     } catch (error) {
        return res.status(500).json({ error: 'Erro ao remover unidade.' });
     }
  }
}
