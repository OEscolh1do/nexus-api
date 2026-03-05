const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const AuditService = require("../audit/audit.service");
const AppError = require("../../utils/AppError");

const OpsService = {
  
  // --- READ OPERATIONS ---

  /**
   * List projects with specialized view columns.
   */
  async getAllProjects() {
    try {
        return await prisma.project.findMany({
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
    } catch (error) {
        throw new AppError("Erro ao listar projetos", 500);
    }
  },

  async getProjectTree(projectId) {
      const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
              tasks: {
                  include: {
                      checklists: true,
                      predecessors: {
                          select: { predecessorId: true }
                      },
                      assignedUser: { select: { fullName: true, id: true } } // Include assignee name
                  }
              }
          }
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

        // Fetch Users (Strict Tenancy)
        const users = await prisma.user.findMany({
            where: { 
                tenantId: tenantId, // Strict Tenant Isolation
                // Falls back to orgUnit if tenantId matches org structure, but prefer explicit tenantId
            },
            select: {
                id: true,
                fullName: true,
                jobTitle: true,
                tasksAssigned: {
                    where: {
                        // NOTE: OperationalTask does NOT have tenantId in current schema.
                        // Tenant isolation is enforced via User.tenantId filter above.
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
                        // NOTE: estimatedHours does NOT exist in current schema
                        // Using task count as proxy for workload
                        dueDate: true,
                        startDate: true
                    }
                }
            }
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
      const project = await prisma.project.create({
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
           
           return await prisma.project.update({
               where: { id: projectId },
               data: data
           });
      } catch (error) {
          throw new AppError("Erro ao atualizar projeto", 500);
      }
  },

  async deleteProject(projectId) {
      try {
          await prisma.project.delete({ where: { id: projectId } });
      } catch (error) {
          throw new AppError("Erro ao excluir projeto", 500);
      }
  },

  async addTask(projectId, taskData) {
    try {
      // Zod already coerced dates, so taskData.startDate is Date object or null
      
      const { dependencies, checklist, ...prismaData } = taskData;
      
      const task = await prisma.operationalTask.create({
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
      
      return task;
    } catch (error) {
      console.error("[OpsService] Failed to add task:", error);
      throw new AppError("Erro ao criar tarefa", 500);
    }
  },

  async updateTask(taskId, data, userId) {
    try {
        const { dependencies, checklist, ...prismaData } = data;
        
        // Transaction since we might update deps
        const task = await prisma.$transaction(async (tx) => {
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
        return await prisma.operationalTask.update({
             where: { id: taskId },
             data: { status }
        });
        // TODO: Audit specific status change
      } catch (error) {
          throw new AppError("Erro ao atualizar status", 500);
      }
  },

  async deleteTask(taskId, userId) {
      try {
        await prisma.operationalTask.delete({ where: { id: taskId } });
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
  }
};

module.exports = OpsService;
