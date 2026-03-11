/**
 * 🔐 AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * 
 * Responsabilidades:
 * 1. Autenticar requisições (verificar token)
 * 2. Autorizar ações com base em RBAC (Role-Based Access Control)
 * 3. Implementar princípio de privilégio mínimo
 * 
 * Matriz de Permissões:
 * - ADMIN: Acesso total (CRUD em todos os recursos)
 * - COORDENACAO: Read/Write em todos os projetos, sem Delete
 * - VENDEDOR: Read/Write apenas em projetos próprios
 * - GUEST: Read-only (se aplicável)
 * 
 * Autor: Antigravity AI
 * Data: 2026-01-20
 */

const IamService = require('../modules/iam/services/iam.service');

// ========================
// AUTENTICAÇÃO (Token Verification)
// ========================
/**
 * Middleware de autenticação básico.
 * Delega a verificação para IamService.
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next callback
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token && req.cookies && req.cookies.nexus_session) {
    token = req.cookies.nexus_session;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido'
    });
  }

  try {
    const user = await IamService.verifyToken(token);

    // Anexar usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    console.warn('[AUTH] Token verification failed:', error.message);

    // CRITICAL: Distinguish between Infrastructure/Database errors and actual logic/auth errors
    // Should NOT return 403 for database failures (e.g. schema drift, connection loss)
    if (
      error.name === 'PrismaClientKnownRequestError' ||
      error.name === 'PrismaClientUnknownRequestError' ||
      error.name === 'PrismaClientInitializationError' ||
      error.name === 'PrismaClientRustPanicError'
    ) {
      console.error('[AUTH] 🚨 Critical Infrastructure Error (Prisma):', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error (Infrastructure)'
      });
    }

    // Explicitly handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Sessão inválida ou expirada'
      });
    }

    // If we catch "User Not Found" from IamService or other logic errors, treat as 403 Forbidden
    const status = error.message === 'User Not Found' ? 403 : 403;

    return res.status(status).json({
      success: false,
      error: 'Sessão inválida ou expirada'
    });
  }
}

// ========================
// AUTORIZAÇÃO (Resource-Based)
// ========================
/**
 * Verifica se o usuário pode EDITAR um projeto específico.
 * 
 * Regras:
 * - ADMIN: Pode editar qualquer projeto
 * - COORDENACAO: Pode editar qualquer projeto
 * - VENDEDOR: Pode editar APENAS projetos onde ele é o manager
 * - Outros: Negado
 * 
 * @param {object} user - Objeto do usuário (de req.user)
 * @param {object} project - Objeto do projeto do Prisma
 * @returns {boolean} True se permitido, false caso contrário
 */
function canEditProject(user, project) {
  // ADMIN tem acesso total
  if (user.role === 'ADMIN') {
    console.log(`[AUTHZ] ✅ ADMIN ${user.username} pode editar projeto ${project.id}`);
    return true;
  }

  // COORDENACAO pode editar qualquer projeto
  if (user.role === 'COORDENACAO') {
    console.log(`[AUTHZ] ✅ COORDENACAO ${user.username} pode editar projeto ${project.id}`);
    return true;
  }

  // VENDEDOR só pode editar seus próprios projetos
  if (user.role === 'VENDEDOR' && project.managerId === user.id) {
    console.log(`[AUTHZ] ✅ VENDEDOR ${user.username} pode editar seu projeto ${project.id}`);
    return true;
  }

  // Caso contrário, negado
  console.warn(`[AUTHZ] ❌ ${user.username} (${user.role}) NÃO pode editar projeto ${project.id}`);
  return false;
}

/**
 * Verifica se o usuário pode DELETAR um projeto específico.
 * 
 * Regras:
 * - ADMIN: Pode deletar qualquer projeto
 * - COORDENACAO: NEGADO (por política de segurança)
 * - VENDEDOR: NEGADO
 * 
 * @param {object} user - Objeto do usuário
 * @param {object} project - Objeto do projeto do Prisma
 * @returns {boolean} True se permitido
 */
function canDeleteProject(user, project) {
  if (user.role === 'ADMIN') {
    console.log(`[AUTHZ] ✅ ADMIN ${user.username} pode deletar projeto ${project.id}`);
    return true;
  }

  console.warn(`[AUTHZ] ❌ ${user.username} (${user.role}) NÃO pode deletar projeto ${project.id}`);
  return false;
}

/**
 * Verifica se o usuário pode LER um projeto específico.
 * 
 * Regras:
 * - ADMIN: Pode ler qualquer projeto
 * - COORDENACAO: Pode ler qualquer projeto
 * - VENDEDOR: Pode ler apenas projetos próprios (managerId)
 * 
 * @param {object} user - Objeto do usuário
 * @param {object} project - Objeto do projeto do Prisma
 * @returns {boolean} True se permitido
 */
function canReadProject(user, project) {
  if (user.role === 'ADMIN' || user.role === 'COORDENACAO') {
    return true;
  }

  if (user.role === 'VENDEDOR' && project.managerId === user.id) {
    return true;
  }

  console.warn(`[AUTHZ] ❌ ${user.username} (${user.role}) NÃO pode ler projeto ${project.id}`);
  return false;
}

// ========================
// MIDDLEWARE DE PROTEÇÃO DE PROJETO
// ========================
/**
 * Middleware para proteger rotas de Project.
 * Valida permissões antes de permitir ações CRUD.
 * 
 * USO:
 * app.put('/api/projects/:id', authenticateToken, protectProject('edit'), async (req, res) => { ... });
 * 
 * @param {string} action - 'read' | 'edit' | 'delete'
 * @returns {Function} Middleware Express
 */
function protectProject(action) {
  return async (req, res, next) => {
    try {
      const { id } = req.params;

      // Buscar o projeto
      const project = await prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          managerId: true,
          title: true,
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Projeto não encontrado'
        });
      }

      // Verificar permissão com base na ação
      let hasPermission = false;

      switch (action) {
        case 'read':
          hasPermission = canReadProject(req.user, project);
          break;
        case 'edit':
          hasPermission = canEditProject(req.user, project);
          break;
        case 'delete':
          hasPermission = canDeleteProject(req.user, project);
          break;
        default:
          console.error(`[AUTHZ] Ação desconhecida: ${action}`);
          return res.status(500).json({
            success: false,
            error: 'Configuração de autorização inválida'
          });
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para realizar esta ação'
        });
      }

      // Anexar projeto à requisição (para evitar busca duplicada)
      req.project = project;
      next();
    } catch (error) {
      console.error('[AUTHZ] Erro ao verificar permissões:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
}

module.exports = {
  authenticateToken,
  canEditProject,
  canDeleteProject,
  canReadProject,
  protectProject,
};
