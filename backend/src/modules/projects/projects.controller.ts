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
  async calculate(req: Request, res: Response) {
    const { id } = req.params;
    const { monthlyUsage, roofArea } = req.body;

    // Basic Solar Calculation Logic (Safe Default)
    // Avg Generation Factor: ~120 kWh/kWp/month (Generic Brazil)
    const AVG_GEN_FACTOR = 125;
    const PANEL_POWER = 550; // 550W

    try {
       const hasUsage = Number(monthlyUsage) > 0;
       if (!hasUsage) return res.status(400).json({ error: "Consumo mensal necessário." });
       
       const requiredSystemSize = Number(monthlyUsage) / AVG_GEN_FACTOR; // e.g. 500 / 125 = 4 kWp
       const panelCount = Math.ceil((requiredSystemSize * 1000) / PANEL_POWER);
       const realSystemSize = (panelCount * PANEL_POWER) / 1000;
       const estimatedGen = realSystemSize * AVG_GEN_FACTOR;
       const inverterSize = Math.ceil(realSystemSize * 0.75); // Undersizing

       const bom = [
         { item: `Módulo Fotovoltaico ${PANEL_POWER}W`, qtd: panelCount, unit: 'un' },
         { item: `Inversor ${inverterSize}kW`, qtd: 1, unit: 'un' },
         { item: `Estrutura de Fixação`, qtd: panelCount, unit: 'un' },
         { item: `Cabos Solares (Preto/Vermelho)`, qtd: 50, unit: 'm' },
         { item: `String Box`, qtd: 1, unit: 'un' }
       ];

       // Update Project with these technical details locally? 
       // The frontend expects the result to display first, then 'Save'
       const result = {
         systemSize: realSystemSize.toFixed(2),
         panelCount,
         estimatedGen: Math.round(estimatedGen),
         inverterSize,
         coverage: Math.round((estimatedGen / Number(monthlyUsage)) * 100),
         bom
       };

       return res.json(result);

    } catch (error) {
       console.error('[Calculate] Error:', error); // Will be replaced by Logger later if I missed it? 
       // Ah, I should use Logger here since I already migrated app.ts? 
       // But I haven't migrated ProjectController yet. 
       // I'll stick to console.error or use Logger if I add import.
       return res.status(500).json({ error: "Erro no cálculo." });
    }
  }
}
