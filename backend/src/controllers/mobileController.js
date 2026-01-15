// /backend/src/controllers/mobileController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CONFIGURAÇÃO: Tarifa média (simbólica)
const TARIFA_MEDIA = 0.92; 

exports.runSimulation = async (req, res) => {
    try {
        // Simulação removida junto com o Foton Engine
        // Retornamos um erro amigável ou dados vazios
        res.status(503).json({ 
            error: "Simulação temporariamente indisponível (Motor de cálculo desativado)." 
        });

    } catch (error) {
        console.error("Erro Mobile:", error);
        res.status(500).json({ error: "Erro ao realizar simulação." });
    }
};

exports.sendLead = async (req, res) => {
    try {
        const { name, phone, email, simulationData } = req.body;

        // 1. Cria ou Atualiza o Cliente
        let client = await prisma.client.findFirst({ where: { email } });
        if (!client) {
            client = await prisma.client.create({
                data: { name, phone, email }
            });
        }

        // 2. Busca o último Rank
        const maxRank = await prisma.project.aggregate({ _max: { rank: true } });
        const newRank = (maxRank._max.rank || 0) + 1000;

        // 3. Cria o Projeto direto no Kanban
        // Removidos campos de cálculo (systemSize, price) que dependiam dos motores
        const project = await prisma.project.create({
            data: {
                title: `Lead App - ${name}`,
                clientId: client.id,
                status: 'LEAD', // Ajustado para LEAD (era CONTACT)
                rank: newRank,
                // Registra apenas o consumo estimado se disponível
                monthlyUsage: simulationData?.monthlyBill ? (parseFloat(simulationData.monthlyBill) / TARIFA_MEDIA) : 0, 
                
                activities: {
                    create: {
                        type: 'SYSTEM',
                        action: 'Lead vindo do App',
                        details: `Lead criado via Mobile`
                    }
                }
            }
        });

        res.status(201).json({ success: true, message: "Recebemos sua solicitação! Um consultor entrará em contato." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao enviar lead." });
    }
};
