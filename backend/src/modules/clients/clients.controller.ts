import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma'; // Singleton import
import { Prisma } from '@prisma/client';

export class ClientController {
  
  // --- LIST ALL CLIENTS ---
  async getAllClients(req: Request, res: Response) {
    try {
      const clients = await prisma.client.findMany({
        include: {
          projects: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(clients);
    } catch (error) {
      console.error('[Clients] List Error:', error);
      return res.status(500).json({ error: 'Erro ao buscar lista de clientes.' });
    }
  }

  // --- GET CLIENT BY ID ---
  async getClientById(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          attachments: true,
          projects: {
            include: { activities: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      return res.json(client);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar cliente.' });
    }
  }

  // --- UPDATE CLIENT ---
  async updateClient(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const { contractAccounts, ...data } = req.body;

    try {
      // Prepare update data
      const updateData: Prisma.ClientUpdateInput = {
        ...data,
      };

      // Handle JSON field safely
      if (contractAccounts) {
        updateData.contractAccounts = contractAccounts;
      }

      const updatedClient = await prisma.client.update({
        where: { id },
        data: updateData,
      });

      return res.json(updatedClient);
    } catch (error) {
      console.error('[Clients] Update Error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar dados do cliente.' });
    }
  }

  // --- DELETE CLIENT (Legacy: Manual Cascade) ---
  // Using Transaction to ensure atomicity
  async deleteClient(req: Request, res: Response) {
    const { id } = req.params as { id: string };

    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Apenas administradores podem excluir clientes.' });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Find projects to delete dependencies
        const projects = await tx.project.findMany({
          where: { clientId: id },
          select: { id: true },
        });

        const projectIds = projects.map((p) => p.id);

        if (projectIds.length > 0) {
          // 2. Delete dependencies in bulk
          await tx.activityLog.deleteMany({
            where: { projectId: { in: projectIds } },
          });
          await tx.consumerUnit.deleteMany({
            where: { projectId: { in: projectIds } },
          });
          await tx.attachment.deleteMany({
            where: { projectId: { in: projectIds } },
          });

          // 3. Delete projects
          await tx.project.deleteMany({
            where: { clientId: id },
          });
        }
        
        // 4. Delete client attachments (if any direct attachments)
        await tx.attachment.deleteMany({
             where: { clientId: id }
        });

        // 5. Delete Client
        await tx.client.delete({
          where: { id },
        });
      });

      return res.json({ message: 'Cliente e todos os dados vinculados excluídos.' });
    } catch (error) {
      console.error('[Clients] Delete Error:', error);
      return res.status(500).json({ error: 'Erro ao excluir cliente.' });
    }
  }
}
