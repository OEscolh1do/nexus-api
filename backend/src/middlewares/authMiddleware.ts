import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // Normalized to 'id'
        role: string;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'nexus_super_secret_key_2024';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};
