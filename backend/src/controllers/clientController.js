// /backend/src/controllers/clientController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- LISTAR TODOS OS CLIENTES (CORRIGIDO) ---
// A correção principal está no "include: { projects: ... }"
exports.getAllClients = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            include: { 
                projects: {
                    // Trazemos os projetos para poder contar quantos são no Frontend
                    select: { 
                        id: true, 
                        title: true, 
                        status: true, 
                        createdAt: true 
                    },
                    orderBy: { createdAt: 'desc' }
                } 
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(clients);
    } catch (error) {
        console.error("Erro ao listar clientes:", error);
        res.status(500).json({ error: 'Erro ao buscar lista de clientes.' });
    }
};

// Atualizar Cliente
exports.updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        // Removemos campos que não devem ser atualizados diretamente
        const { id: _, attachments, projects, ...data } = req.body;

        const updatedClient = await prisma.client.update({
            where: { id },
            data: {
                ...data,
                // Garante que campos JSON não quebrem se vierem vazios
                contractAccounts: data.contractAccounts || [] 
            }
        });

        res.json(updatedClient);
    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        res.status(500).json({ error: 'Erro ao atualizar dados do cliente.' });
    }
};

// Buscar Cliente Único (Detalhes)
exports.getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: { 
                attachments: true, 
                projects: {
                    include: { activities: true } // Inclui atividades se necessário
                }
            }
        });
        if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cliente.' });
    }
};

// Excluir Cliente (Cascade Manual Completo)
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem excluir clientes.' });
        }

        // 1. Busca todos os projetos do cliente para limpar dependências
        const projects = await prisma.project.findMany({ 
            where: { clientId: id },
            select: { id: true }
        });
        
        const projectIds = projects.map(p => p.id);

        if (projectIds.length > 0) {
            // 2. Limpa tabelas "filhas" dos projetos (para evitar erro de Foreign Key)
            await prisma.activityLog.deleteMany({ where: { projectId: { in: projectIds } } });
            await prisma.consumerUnit.deleteMany({ where: { projectId: { in: projectIds } } });
            await prisma.attachment.deleteMany({ where: { projectId: { in: projectIds } } });
            
            // 3. Agora é seguro apagar os projetos
            await prisma.project.deleteMany({ where: { clientId: id } });
        }

        // 4. Por fim, apaga o cliente
        await prisma.client.delete({ where: { id } });

        res.json({ message: 'Cliente e todos os dados vinculados excluídos.' });
    } catch (error) {
        console.error("Erro delete cliente:", error);
        if (error.code === 'P2025') return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.status(500).json({ error: 'Erro ao excluir cliente.' });
    }
};