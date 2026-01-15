// /backend/src/controllers/projectController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dados de irradiação média (HSP) por região
const IRRADIANCE_MAP = {
    'NORTE': 4.5,
    'NORDESTE': 5.2, // Sol forte
    'CENTRO-OESTE': 4.9,
    'SUDESTE': 4.6,
    'SUL': 4.2
};

// ==================================================================================
// 1. CALCULAR SISTEMA (Módulo FÓTON)
// ==================================================================================
exports.calculateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            monthlyUsage, // Consumo em kWh (ex: 500)
            location,     // Região (ex: NORDESTE)
            roofType,     // Tipo de telhado (ex: Cerâmico, Metálico)
            panelId,      // ID do painel selecionado no modal
            inverterId    // ID do inversor selecionado
        } = req.body;

        const usage = parseFloat(monthlyUsage) || 0;
        const hsp = IRRADIANCE_MAP[location] || 4.5;
        const performanceRatio = 0.75; // Perda padrão de 25% (temp, cabos, sujeira)

        // 1. Busca o Painel no Catálogo (ou usa o mais potente como padrão)
        let panel;
        if (panelId) {
            panel = await prisma.solarPanel.findUnique({ where: { id: panelId } });
        } else {
            // Pega o primeiro painel mais potente se nenhum for selecionado
            panel = await prisma.solarPanel.findFirst({ orderBy: { power: 'desc' } });
        }

        if (!panel) return res.status(400).json({ error: "Nenhum painel cadastrado no catálogo." });

        // 2. Cálculo de Potência Necessária
        // Fórmula: Energia = Potência * HSP * Dias * PR
        // Potência = Energia / (HSP * 30 * PR)
        const targetSystemSizeKw = usage / (hsp * 30 * performanceRatio);
        
        const panelPowerKw = panel.power / 1000; // Converte W para kW 
        const panelCount = Math.ceil(targetSystemSizeKw / panelPowerKw);
        
        const finalSystemSize = panelCount * panelPowerKw; // Potência real instalada 
        const estimatedGeneration = finalSystemSize * hsp * 30 * performanceRatio;

        // 3. Busca o Inversor ideal (Dimensionamento)
        // Regra: O inversor deve suportar a potência, permitindo um Overload de até 30%
        let inverter;
        if (inverterId) {
            inverter = await prisma.inverter.findUnique({ where: { id: inverterId } });
        } else {
            // Busca um inversor onde a potência nominal seja próxima da instalada
            const minInverterPower = finalSystemSize / 1.4; 
            
            inverter = await prisma.inverter.findFirst({
                where: { nominalPower: { gte: minInverterPower } },
                orderBy: { nominalPower: 'asc' }
            });
        }

        // 4. GERAÇÃO INTELIGENTE DA LISTA DE MATERIAIS (BoM)
        const bom = [];

        // A) Módulos
        bom.push({
            item: `Módulo Fotovoltaico ${panel.manufacturer} ${panel.model} - ${panel.power}W`,
            qtd: panelCount,
            unit: 'un'
        });

        // B) Inversor
        if (inverter) {
            bom.push({
                item: `Inversor ${inverter.manufacturer} ${inverter.model} - ${inverter.nominalPower}kW`,
                qtd: 1, 
                unit: 'un'
            });
        } else {
            bom.push({ item: 'Inversor Adequado (A definir)', qtd: 1, unit: 'un' });
        }

        // C) Estrutura de Fixação (Varia com o telhado)
        let structureItem = 'Estrutura de Fixação Padrão';
        
        if (roofType === 'Cerâmico') structureItem = 'Gancho Inox p/ Telha Cerâmica + Trilhos';
        if (roofType === 'Metálico') structureItem = 'Parafuso Prisioneiro + Mini-trilho';
        if (roofType === 'Fibrocimento') structureItem = 'Parafuso Haste Dupla p/ Fibrocimento';
        if (roofType === 'Solo') structureItem = 'Estrutura de Solo (Concreto/Estacas)';
        if (roofType === 'Laje') structureItem = 'Triângulos de Concreto/Lastro';

        bom.push({
            item: `Kit Estrutura: ${structureItem} (Alumínio Anodizado)`,
            qtd: 1, // Vendido como Kit
            unit: 'kit'
        });

        // D) Proteção e Cabos (String Box + Cabos Solares)
        bom.push({
            item: 'String Box CC/CA (Disjuntores + DPS)',
            qtd: 1,
            unit: 'cj'
        });

        // Estimativa de cabos: 15m de vermelho + 15m de preto por string (média residencial)
        bom.push({
            item: 'Cabo Solar 6mm² Vermelho (Proteção UV)',
            qtd: 50,
            unit: 'm'
        });
        bom.push({
            item: 'Cabo Solar 6mm² Preto (Proteção UV)',
            qtd: 50,
            unit: 'm'
        });
        
        // Conectores MC4 (2 pares por string + reserva)
        bom.push({
            item: 'Par de Conectores MC4 (Macho/Fêmea)',
            qtd: 4,
            unit: 'par'
        });

        // 5. Salva no Projeto
        await prisma.project.update({
            where: { id },
            data: {
                systemSize: finalSystemSize,
                panelCount: panelCount,
                estimatedGen: estimatedGeneration,
                monthlyUsage: usage,
                bom: bom, // Prisma converte array JS para JSON automaticamente
                solarPanelId: panel.id,
                inverterId: inverter ? inverter.id : null,
                location: location,
                roofType: roofType,
                orientation: 'NORTE' // Padrão ou vindo do body
            }
        });

        res.json({
            systemSize: finalSystemSize.toFixed(2),
            panelCount,
            estimatedGen: Math.round(estimatedGeneration),
            inverterSize: inverter ? inverter.nominalPower : 'N/A',
            coverage: Math.round((estimatedGeneration / usage) * 100),
            bom,
            suggestedPanel: panel,
            suggestedInverter: inverter
        });

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: "Erro ao calcular sistema." });
    }
};

// ==================================================================================
// 2. OPERAÇÕES CRUD PADRÃO
// ==================================================================================

// Criar Projeto (Lead)
exports.createProject = async (req, res) => {
    try {
        const { 
            title, 
            status, 
            description,
            // Dados do Cliente Novo
            clientName, 
            clientPhone, 
            clientEmail,
            // ID do Cliente Existente
            clientId 
        } = req.body;

        const clientData = clientId 
            ? { connect: { id: clientId } } 
            : { create: { name: clientName, phone: clientPhone, email: clientEmail } };

        const newProject = await prisma.project.create({
            data: {
                title,
                status: status || 'LEAD',
                description,
                client: clientData,
                history: {
                    create: {
                        status: status || 'LEAD',
                        notes: 'Projeto criado no sistema.'
                    }
                }
            },
            include: { client: true }
        });

        res.status(201).json(newProject);
    } catch (error) {
        console.error("Erro ao criar projeto:", error);
        res.status(500).json({ error: 'Erro ao criar projeto' });
    }
};

// Listar Todos os Projetos
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: { 
                client: true,
                attachments: true // Se quiser listar anexos na lista geral
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        console.error("Erro ao buscar projetos:", error);
        res.status(500).json({ error: 'Erro ao buscar projetos' });
    }
};

// Buscar Projeto por ID
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: { 
                client: true,
                attachments: true,
                history: { orderBy: { changedAt: 'desc' } }, // Histórico de status
                solarPanel: true,
                inverter: true
            }
        });

        if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

        res.json(project);
    } catch (error) {
        console.error("Erro ao buscar projeto:", error);
        res.status(500).json({ error: 'Erro ao buscar projeto' });
    }
};

// Atualizar Projeto (Geral)
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, pipeline, rank, ...data } = req.body;

        // Se houver mudança de status, registra no histórico
        if (status) {
            await prisma.activity.create({
                data: {
                    projectId: id,
                    type: 'STATUS_CHANGE',
                    action: `Mudança para ${status}`,
                    details: `Pipeline: ${pipeline || 'Padrão'}`
                }
            });
        }

        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                status,
                pipeline,
                rank,
                ...data
            },
            include: { client: true }
        });

        res.json(updatedProject);
    } catch (error) {
        console.error("Erro ao atualizar projeto:", error);
        res.status(500).json({ error: 'Erro ao atualizar projeto' });
    }
};

// Deletar Projeto
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Projeto removido com sucesso' });
    } catch (error) {
        console.error("Erro ao deletar projeto:", error);
        res.status(500).json({ error: 'Erro ao deletar projeto' });
    }
};