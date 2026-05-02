const prisma = require('../../../lib/prisma');
const { withTenant } = require('../../../lib/prisma');
const AuditService = require("../../audit/audit.service");
const AppError = require("../../../utils/AppError");

const OpsService = {

    // --- READ OPERATIONS ---

    /**
     * List projects with specialized view columns.
     */
    async getAllProjects() {
        try {
            return await withTenant(async (tx) => {
                return tx.project.findMany({
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        tasks: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                startDate: true,
                                endDate: true,
                                dueDate: true,
                                assignedTo: true,
                                predecessors: {
                                    select: { predecessorId: true }
                                }
                            }
                        },
                        manager: { select: { fullName: true } }
                    }
                });
            });
        } catch (error) {
            throw new AppError("Erro ao listar projetos", 500);
        }
    },

    async getProjectTree(projectId) {
        const project = await withTenant(async (tx) => {
            return tx.project.findUnique({
                where: { id: projectId },
                include: {
                    tasks: {
                        include: {
                            checklists: true,
                            predecessors: {
                                select: { predecessorId: true }
                            },
                            assignedUser: { select: { fullName: true, id: true } }
                        }
                    }
                }
            });
        });

        if (!project) throw new AppError("Projeto não encontrado", 404);
        return project;
    },

    /**
     * Calculates workload analytics using raw SQL or aggregation.
     */
    /**
     * Calculates workload analytics with STRICT Multi-tenancy.
     * Replaces legacy getTeamWorkload.
     */
    async getGlobalWorkload(tenantId, filters = {}) {
        try {
            if (!tenantId) {
                console.error("[OpsService] Security Alert: Missing tenantId in getGlobalWorkload");
                throw new AppError("Contexto de organização não identificado", 400);
            }

            const { startDate, endDate, projectId } = filters;

            // Date Range Logic (Default: Current Month)
            const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
            const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1));

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new AppError("Datas inválidas fornecidas", 400);
            }

            const users = await withTenant(async (tx) => {
                return tx.user.findMany({
                    where: {
                        tenantId: tenantId,
                    },
                    select: {
                        id: true,
                        fullName: true,
                        jobTitle: true,
                        tasksAssigned: {
                            where: {
                                AND: [
                                    {
                                        OR: [
                                            { startDate: { gte: start, lte: end } },
                                            { dueDate: { gte: start, lte: end } }
                                        ]
                                    },
                                    projectId ? { projectId } : {}
                                ]
                            },
                            select: {
                                id: true,
                                status: true,
                                dueDate: true,
                                startDate: true
                            }
                        }
                    }
                });
            });

            // Calculate Metrics per User
            // Frontend expects: { userId, userFullName, weeks: [{weekLabel, taskCount, status}] }
            const taskCount = (tasks) => tasks.length;

            // Simple status based on task count (since we don't have estimated hours)
            const getStatus = (count) => {
                if (count >= 6) return 'HIGH';
                if (count >= 3) return 'MEDIUM';
                return 'LOW';
            };

            // Generate 4 weeks worth of data (simplified - all tasks in current period)
            const generateWeeks = (tasks) => {
                const weeks = [];
                const now = new Date();
                for (let i = 0; i < 4; i++) {
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() + (i * 7));
                    const weekLabel = `Sem ${i + 1}`;

                    // For simplicity, distribute tasks evenly or count by week
                    // In real implementation, filter tasks by week's date range
                    const weekTaskCount = Math.ceil(tasks.length / 4);

                    weeks.push({
                        weekLabel,
                        taskCount: i === 0 ? tasks.length : weekTaskCount,
                        status: getStatus(i === 0 ? tasks.length : weekTaskCount)
                    });
                }
                return weeks;
            };

            return users.map(user => {
                return {
                    userId: user.id,
                    userFullName: user.fullName || 'Sem Nome',
                    weeks: generateWeeks(user.tasksAssigned)
                };
            }).filter(u => u.weeks.some(w => w.taskCount > 0)); // Only users with tasks

        } catch (error) {
            console.error("[OpsService] GlobalWorkload Error:", error);
            throw new AppError("Erro ao calcular workload", 500);
        }
    },

    // --- WRITE OPERATIONS ---

    async createProject(data) {
        const { title, customerId, type, managerId, details, userId, strategyId, description, startDate, endDate } = data;

        try {
            const project = await withTenant(async (tx) => {
                return tx.project.create({
                    data: {
                        title,
                        customer_id: customerId,
                        strategyId: strategyId,
                        type: type || 'GENERIC',
                        status: 'NOT_STARTED',
                        managerId: managerId,
                        description: description,
                        startDate: startDate,
                        endDate: endDate,
                        details: details ? JSON.stringify(details) : "{}"
                    }
                });
            });

            if (userId) {
                // Async audit (não bloqueia resposta, mas se falhar, ok)
                AuditService.logAudit({
                    userId,
                    action: 'OPS_CREATE_PROJECT',
                    resourceId: project.id,
                    entity: 'Project',
                    details: { title, type }
                }).catch(err => console.warn("Audit Log Failed:", err.message));
            }

            return project;
        } catch (error) {
            console.error("[OpsService] Failed to create project:", error);
            throw new AppError("Erro ao criar projeto", 500);
        }
    },

    async updateProject(projectId, data) {
        try {
            // JSON Handling for legacy 'details' field if passed
            if (data.details && typeof data.details === 'object') {
                data.details = JSON.stringify(data.details);
            }

            return await withTenant(async (tx) => {
                return tx.project.update({
                    where: { id: projectId },
                    data: data
                });
            });
        } catch (error) {
            throw new AppError("Erro ao atualizar projeto", 500);
        }
    },

    async deleteProject(projectId) {
        try {
            await withTenant(async (tx) => {
                return tx.project.delete({ where: { id: projectId } });
            });
        } catch (error) {
            throw new AppError("Erro ao excluir projeto", 500);
        }
    },

    async addTask(projectId, taskData) {
        try {
            // Zod already coerced dates, so taskData.startDate is Date object or null

            const { dependencies, checklist, ...prismaData } = taskData;

            const task = await withTenant(async (tx) => {
                return tx.operationalTask.create({
                    data: {
                        projectId,
                        ...prismaData,
                        status: prismaData.status || 'BACKLOG',
                        // Handle Dependencies Creation
                        predecessors: dependencies && dependencies.length > 0 ? {
                            create: dependencies.map(pid => ({ predecessorId: pid, type: 'FINISH_TO_START' }))
                        } : undefined
                    }
                });
            });

            return task;
        } catch (error) {
            console.error("[OpsService] Failed to add task:", error);
            throw new AppError("Erro ao criar tarefa", 500);
        }
    },

    async updateTask(taskId, data, userId) {
        try {
            const { dependencies, checklist, ...prismaData } = data;

            // L8 SEC-OPS PATCH: Usar withTenant em vez de raw transaction
            // Isto garante que o set_config do tenant seja ativado no PGSQL,
            // impedindo que a query modifique dados alheios caso falhe o auth check de app.
            const task = await withTenant(async (tx) => {
                const updated = await tx.operationalTask.update({
                    where: { id: taskId },
                    data: prismaData
                });

                // Sync Dependencies (Full Replace Strategy)
                if (dependencies) { // Only update if dependencies key is present (even if empty array)
                    await tx.taskDependency.deleteMany({ where: { successorId: taskId } });

                    if (dependencies.length > 0) {
                        await tx.taskDependency.createMany({
                            data: dependencies.map(predId => ({
                                predecessorId: predId,
                                successorId: taskId,
                                type: 'FINISH_TO_START'
                            }))
                        });
                    }
                }
                return updated;
            });

            if (userId) {
                AuditService.logAudit({
                    userId,
                    action: 'OPS_UPDATE_TASK',
                    resourceId: taskId,
                    entity: 'OperationalTask',
                    details: prismaData
                }).catch(e => console.warn(e));
            }

            return task;
        } catch (e) {
            console.error("[OpsService] updateTask FAILED:", e);
            throw new AppError("Erro ao atualizar tarefa", 500);
        }
    },

    async updateTaskStatus(taskId, status, userId) {
        try {
            return await withTenant(async (tx) => {
                return tx.operationalTask.update({
                    where: { id: taskId },
                    data: { status }
                });
            });
            // TODO: Audit specific status change
        } catch (error) {
            throw new AppError("Erro ao atualizar status", 500);
        }
    },

    async deleteTask(taskId, userId) {
        try {
            await withTenant(async (tx) => {
                return tx.operationalTask.delete({ where: { id: taskId } });
            });
        } catch (error) {
            throw new AppError("Erro ao excluir tarefa", 500);
        }
    },

    async processInspection(data, userId) {
        // ... (Mantendo lógica existente para não quebrar)
        const payload = Array.isArray(data) ? data : [data];
        const results = [];

        for (const item of payload) {
            if (item.projectId) {
                await this.addTask(item.projectId, {
                    title: `Vistoria: ${item.structural?.structureCondition || 'Nova'}`,
                    description: `Vistoria recebida. Detalhes em anexo.`,
                    status: 'TODO'
                });
            }
            results.push({ success: true, id: item.id });
        }
        return results;
    },

    // --- CALENDAR & TEAM ---

    async getCalendarEvents(tenantId, month, year) {
        if (!tenantId) throw new AppError("Contexto de organização não identificado", 400);

        const targetMonth = parseInt(month, 10);
        const targetYear = parseInt(year, 10);

        const users = await withTenant(async (tx) => {
             return tx.user.findMany({
                 where: { tenantId },
                 select: { id: true, fullName: true, birthDate: true }
             });
        });

        const leaves = await withTenant(async (tx) => {
             // For simplicity, fetch all leaves and filter in memory since we need to generate dates
             // In a robust scenario, we'd use raw SQL for date range overlaps
             return tx.hRLeave.findMany({
                 where: { 
                    requester: { tenantId },
                    status: { not: "REJEITADO" }
                 },
                 include: { requester: { select: { fullName: true } } }
             });
        });

        const events = [];

        // 1. Birthdays
        users.forEach(u => {
             if (u.birthDate) {
                 const bDate = new Date(u.birthDate);
                 if (bDate.getMonth() === targetMonth) {
                     const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}`;
                     events.push({
                         date: dateStr,
                         type: 'BIRTHDAY',
                         userFullName: u.fullName,
                         userId: u.id
                     });
                 }
             }
        });

        // 2. Leaves
        leaves.forEach(l => {
             const start = new Date(l.startDate);
             const end = new Date(l.endDate);
             
             // Normalize to dates
             let current = new Date(start);
             while (current <= end) {
                 if (current.getMonth() === targetMonth && current.getFullYear() === targetYear) {
                     const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                     // Try mapping HRLeave types to frontend LeaveType
                     let type = l.type;
                     if (!['FERIAS', 'FOLGA', 'ATESTADO', 'LICENCA'].includes(type)) type = 'FERIAS';

                     events.push({
                         date: dateStr,
                         type: type,
                         userFullName: l.requester.fullName,
                         userId: l.requesterId
                     });
                 }
                 current.setDate(current.getDate() + 1);
             }
        });

        return events;
    },

    async getTeamHierarchy(tenantId) {
        if (!tenantId) throw new AppError("Contexto de organização não identificado", 400);

        const users = await withTenant(async (tx) => {
            return tx.user.findMany({
                where: { tenantId },
                select: { id: true, fullName: true, jobTitle: true, supervisorId: true, leaveRequests: {
                    where: { 
                        status: 'APROVADO',
                        startDate: { lte: new Date() },
                        endDate: { gte: new Date() }
                    }
                } }
            });
        });

        const buildNode = (user) => {
            const isUnavailable = user.leaveRequests && user.leaveRequests.length > 0;
            return {
                id: user.id,
                user: {
                    id: user.id,
                    fullName: user.fullName || "Sem Nome",
                    jobTitle: user.jobTitle || "Membro",
                },
                status: isUnavailable ? 'UNAVAILABLE' : 'AVAILABLE',
                children: users.filter(u => u.supervisorId === user.id).map(buildNode)
            };
        };

        const roots = users.filter(u => !u.supervisorId || !users.some(parent => parent.id === u.supervisorId));
        return roots.map(buildNode);
    },

    async createLeave(data, userId, tenantId) {
        return await withTenant(async (tx) => {
            return tx.hRLeave.create({
                data: {
                    type: data.type,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    reason: data.reason,
                    requesterId: data.userId || userId,
                    status: 'APROVADO' // Auto-approve for demo
                }
            });
        });
    }
};

module.exports = OpsService;
