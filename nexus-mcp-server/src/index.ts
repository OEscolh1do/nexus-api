import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// @ts-ignore
import { PrismaClient } from '@prisma/client';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Inicializa o cliente Prisma apontando para o banco de dados do Nexus Monolith
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/nexus_db?schema=public",
        },
    },
});

// 🛡️ SECURITY: Token Bucket in-memory Rate Limiting para Agentes IA
interface TokenBucket {
    tokens: number;
    lastRefill: number;
}
const BUCKET_SIZE = 15; // Máx de requests em burst
const REFILL_RATE = 1;  // 1 token recuperado por segundo
const rateLimits = new Map<string, TokenBucket>();

function checkRateLimit(tenantId: string): boolean {
    const now = Date.now();
    if (!rateLimits.has(tenantId)) {
        rateLimits.set(tenantId, { tokens: BUCKET_SIZE - 1, lastRefill: now });
        return true;
    }
    const bucket = rateLimits.get(tenantId)!;
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(BUCKET_SIZE, bucket.tokens + elapsedSeconds * REFILL_RATE);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return true;
    }
    return false;
}

// Cria a instância do Servidor MCP
const server = new Server(
    {
        name: "nexus-enterprise-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// 1. Registrando as Ferramentas (Tools) disponíveis para a IA
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_project_health",
                description: "Obtém a saúde financeira e o status EVM (Curva S) de um projeto específico.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "O ID do Projeto (ex: proj_123)",
                        },
                        tenantId: {
                            type: "string",
                            description: "O ID do Tenant (Cliente) para aplicar governança RLS",
                        }
                    },
                    required: ["projectId", "tenantId"],
                },
            },
            {
                name: "list_pending_approvals",
                description: "Lista todos os Portões de Aprovação (Change Orders, Invoices) aguardando assinatura C-Level.",
                inputSchema: {
                    type: "object",
                    properties: {
                        tenantId: {
                            type: "string",
                            description: "O ID do Tenant (Cliente) para aplicar governança RLS",
                        },
                    },
                    required: ["tenantId"],
                },
            },
            {
                name: "get_vendor_reports",
                description: "Resumo cruzado de Diários de Obra (RDOs) e Notas Fiscais (Invoices) submetidos por um Fornecedor/Empreiteiro.",
                inputSchema: {
                    type: "object",
                    properties: {
                        vendorId: {
                            type: "string",
                            description: "O ID único do Terceirizado/Empreiteiro (ex: v_777_empreiteira_alpha)",
                        },
                        tenantId: {
                            type: "string",
                            description: "O ID do Tenant (Cliente) da corporação."
                        }
                    },
                    required: ["vendorId", "tenantId"],
                },
            }
        ],
    };
});

// 2. Implementando a lógica de execução das Ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tenantIdContext = (args as any)?.tenantId || "UNKNOWN_TENANT";

    // Rate Limiting Firewall
    if (!checkRateLimit(tenantIdContext)) {
        return {
            content: [{ type: "text", text: `[RATE_LIMIT_EXCEEDED] Agente bloqueado por cota de requisições excedida. O limite de segurança do banco é 15 req/burts para o tenant ${tenantIdContext}. Aguarde para refilar seus tokens.` }],
            isError: true,
        };
    }

    try {
        if (name === "get_project_health") {
            const { projectId, tenantId } = args as { projectId: string; tenantId: string };

            // Simula a injeção RLS buscando tarefas apenas do Tenant solicitado
            const tasks = await prisma.operationalTask.findMany({
                where: {
                    projectId: projectId,
                    tenantId: tenantId
                }
            });

            if (!tasks || tasks.length === 0) {
                return {
                    content: [{ type: "text", text: `Nenhuma tarefa encontrada para o projeto ${projectId} no tenant ${tenantId}.` }],
                };
            }

            let totalPV = 0;
            let totalEV = 0;
            let totalAC = 0;

            tasks.forEach((t: any) => {
                totalPV += t.plannedValue || 0;
                totalEV += t.earnedValue || 0;
                totalAC += t.actualCost || 0;
            });

            const SPI = totalPV > 0 ? (totalEV / totalPV).toFixed(2) : "N/A";
            const CPI = totalAC > 0 ? (totalEV / totalAC).toFixed(2) : "N/A";

            const report = `Análise EVM do Projeto ${projectId}:\n- Planned Value (PV): R$ ${totalPV}\n- Earned Value (EV): R$ ${totalEV}\n- Actual Cost (AC): R$ ${totalAC}\n\nSaúde:\n- SPI (Cronograma): ${SPI}\n- CPI (Custo): ${CPI}\n\nStatus: ${Number(CPI) < 1 ? 'ALERTA: Custo estourado' : 'Saudável'}`;

            return {
                content: [{ type: "text", text: report }],
            };
        }

        if (name === "list_pending_approvals") {
            const { tenantId } = args as { tenantId: string };

            const pendingGates = await prisma.approvalGate.findMany({
                where: {
                    tenantId: tenantId,
                    status: 'PENDING'
                },
                orderBy: { deadlineAt: 'asc' }
            });

            if (pendingGates.length === 0) {
                return { content: [{ type: "text", text: "Nenhuma aprovação C-Level pendente." }] };
            }

            const formatted = pendingGates.map((g: any) =>
                `ID: ${g.id} | Tipo: ${g.resourceType} | Ref: ${g.resourceId} | Prazo: ${g.deadlineAt.toISOString()} | Requer: ${g.requiredRole}`
            ).join('\n');

            return {
                content: [{ type: "text", text: `Aprovações Pendentes:\n${formatted}` }],
            };
        }

        if (name === "get_vendor_reports") {
            const { vendorId, tenantId } = args as { vendorId: string; tenantId: string };

            const [invoices, rdos] = await Promise.all([
                prisma.invoice.findMany({ where: { vendorId: vendorId, tenantId: tenantId } }),
                prisma.dailyReport.findMany({ where: { vendorId: vendorId, tenantId: tenantId } })
            ]);

            const invStr = invoices.length > 0
                ? invoices.map((i: any) => `- [${i.status}] NF: ${i.invoiceNumber} | Valor: R$ ${i.amount}`).join('\n')
                : "Nenhuma Nota Fiscal submetida.";

            const rdoStr = rdos.length > 0
                ? rdos.map((r: any) => `- [${new Date(r.reportDate).toLocaleDateString()}] Clima: ${r.weather} | Efetivo: ${r.workersCount} | Atv: ${r.activities}`).join('\n')
                : "Nenhum Relatório Diário (RDO) submetido.";

            return {
                content: [{ type: "text", text: `Relatório do Fornecedor [${vendorId}]:\n\n--- INVOICES ---\n${invStr}\n\n--- RDOs Diários ---\n${rdoStr}` }],
            };
        }

        throw new Error(`Tool unknown: ${name}`);

    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Erro ao executar a ferramenta: ${error.message}` }],
            isError: true,
        };
    }
});

// 3. Inicializa o servidor MCP via STDIO (Padrão para integrações locais/Clis)
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Nexus Enterprise MCP Server running on stdio");
}

main().catch(console.error);
