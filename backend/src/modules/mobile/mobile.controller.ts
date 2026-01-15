import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma'; // Singleton import

const TARIFA_MEDIA = 0.92;

export class MobileController {
  
  // --- SIMULATION (Disabled) ---
  async runSimulation(req: Request, res: Response) {
    return res.status(503).json({ 
        error: "Simulação temporariamente indisponível (Motor de cálculo desativado)." 
    });
  }

  // --- SEND LEAD ---
  async sendLead(req: Request, res: Response) {
    try {
        const { name, phone, email, simulationData } = req.body;

        // Basic validation (or use Zod if we added middleware)
        if(!name || !phone) return res.status(400).json({ error: 'Nome e telefone obrigatórios.' });

        // 1. Transaction to Create/Update Client and Project
        await prisma.$transaction(async (tx) => {
             // 1. Find or Create Client
            let client = await tx.client.findFirst({ where: { email } });
            if (!client) {
                // Determine if we can create without email if checking via phone? 
                // Legacy checked email. If no email, duplicate might happen.
                // We'll create blindly if no email match, just like legacy.
                client = await tx.client.create({
                    data: { name, phone, email }
                });
            }

            // 2. Get Rank
            const maxRank = await tx.project.aggregate({ _max: { rank: true } });
            const newRank = (maxRank._max.rank || 0) + 1000;

            // 3. Create Project
            await tx.project.create({
                data: {
                    title: `Lead App - ${name}`,
                    clientId: client.id,
                    status: 'LEAD',
                    rank: newRank,
                    monthlyUsage: simulationData?.monthlyBill ? (parseFloat(simulationData.monthlyBill) / TARIFA_MEDIA) : 0,
                    activities: {
                        create: {
                            type: 'SYSTEM',
                            action: 'Lead vindo do App',
                            details: 'Lead criado via Mobile'
                        }
                    }
                }
            });
        });

        return res.status(201).json({ success: true, message: "Recebemos sua solicitação! Um consultor entrará em contato." });

    } catch (error) {
        console.error('Erro Mobile:', error);
        return res.status(500).json({ error: "Erro ao enviar lead." });
    }
  }
}
