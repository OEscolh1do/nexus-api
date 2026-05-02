const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const AppError = require("../../../utils/AppError");

const prisma = require('../../../lib/prisma');
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-default-dev-key";

// Cliente JWKS do Logto Cloud
const client = jwksClient({
  jwksUri: process.env.LOGTO_JWKS_URI || 'https://214fzz.logto.app/oidc/jwks',
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  if (header.kid) {
    client.getSigningKey(header.kid, function(err, key) {
      if (err) {
        return callback(err);
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  } else {
    // Fallback para token local (assinatura simétrica JWT_SECRET)
    callback(null, JWT_SECRET);
  }
}

// L8 SEC-OPS PATCH: Previne que um Cold Start sem variáveis forje uma chave-mestra previsível
if (process.env.NODE_ENV === 'production' && JWT_SECRET === "super-secret-default-dev-key") {
  throw new Error("🚨 FATAL SECURITY FLAW: JWT_SECRET is missing in production environment. Halting server to prevent universal token cryptographic hijacking.");
}

const IamService = {
  /**
   * Authenticates a user with username and password.
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<{token: string, user: object}>}
   */
  async login(username, password) {
    const user = await prisma.user.findUnique({
      where: { username },
      // 🛡️ Fix: Explicitly select fields to avoid 'tenantId' error (Prisma Client mismatch)
      select: {
        id: true,
        username: true,
        password: true,
        fullName: true,
        role: true,
        orgUnitId: true,
        tenantId: true
      }
    });

    if (!user) {
      throw new AppError("Credenciais inválidas", 401);
    }

    // 🔒 Segurança: Verificar senha com Bcrypt
    // Estratégia de Migração: Suporta senhas antigas (texto plano) e novas (hash)
    const isBcryptHash = user.password.startsWith("$2");
    let isValid = false;

    if (isBcryptHash) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy Plaintext Fallback (Auto-Hash on successful login)
      isValid = (user.password === password);
      if (isValid) {
        // Upgrade to Bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log(`[IAM] Senha do usuário ${username} migrada para Bcrypt com sucesso.`);
      }
    }

    if (!isValid) {
      throw new AppError("Credenciais inválidas", 401);
    }

    // Remove password from returned object
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        tenantId: user.tenantId || 'default-tenant-001'
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 🛡️ Persistence Phase: Registrar sessão no banco para permitir revogação
    try {
      await prisma.session.create({
        data: {
          userId: user.id,
          token: token, // Armazenamos o token inteiro (ou hash, mas para MVP o token resolve)
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h
        }
      });
    } catch (sessionError) {
      console.error("[IAM] Failed to persist session, but issuing token anyway:", sessionError.message);
    }

    return {
      token,
      user: userWithoutPassword
    };
  },

  /**
   * Verifies a token and returns the associated user.
   * @param {string} token 
   * @returns {Promise<object>} The user object
   */
  async verifyToken(token) {
    try {
      const decoded = await new Promise((resolve, reject) => {
        // Usa a função getKey que resolve o JWKS ou faz fallback pro SECRET local
        jwt.verify(token, getKey, {}, (err, decodedResult) => {
          if (err) return reject(err);
          resolve(decodedResult);
        });
      });

      // Permitimos pular a checagem de session se for um token do Logto (identificado por ex: por ter "iss" de org externa)
      if (!decoded.iss || !decoded.iss.includes('logto')) {
        const session = await prisma.session.findUnique({
          where: { token: token }
        });

        if (!session) {
          throw new AppError("Sessão revogada ou inexistente", 401);
        }
      }

      // Opcional: Verificar se o usuário ainda existe no banco
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          role: true,
          orgUnitId: true, // 🔐 Tenant Context
          tenantId: true,  // 🔐 Multi-tenancy Isolation Key (Sync Required!)
        },
      });

      if (!user) {
        throw new AppError("Usuário não encontrado ou desativado", 401);
      }

      return user;
    } catch (err) {
      console.warn('[IAM] verifyToken error:', err.message);
      throw new AppError("Token inválido ou expirado", 401);
    }
  },

  /**
   * Returns all users from the database, scoped by Tenant.
   * L8 SEC-OPS PATCH: Prevents Global Identity Leak.
   * @param {string} tenantId - The tenant's ID
   * @returns {Promise<object[]>} List of scoped users
   */
  async getAllUsers(tenantId) {
    if (!tenantId) {
      throw new AppError("Acesso negado: Contexto Corporativo (Tenant) ausente.", 403);
    }

    try {
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true
        }
      });
      return users;
    } catch (error) {
      console.error("[IamService] getAllUsers FAILED:", error);
      throw new AppError("Erro ao buscar usuários", 500);
    }
  },

  /**
   * Returns permissions for a specific user role.
   * This is the foundation for RBAC.
   * @param {string} role 
   */
  getPermissionsForRole(role) {
    const permissions = {
      'ADMIN': ['*'],
      'COORDENACAO': ['project:read', 'project:write', 'project:edit'],
      'VENDEDOR': ['project:read:own', 'project:write:own', 'proposal:create'],
      'TECNICO': ['task:read', 'task:update', 'inspection:create']
    };
    return permissions[role] || [];
  }
};

module.exports = IamService;
