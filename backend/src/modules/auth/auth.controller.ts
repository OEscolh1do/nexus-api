import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

export class AuthController {
  
  // --- LOGIN ---
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const secret = process.env.JWT_SECRET || 'nexus_super_secret_key_2024';
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        secret,
        { expiresIn: '12h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Erro ao processar login.' });
    }
  }

  // --- REGISTER (Public/Admin) ---
  async register(req: Request, res: Response) {
    const { email, password, name, role } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: role || 'SALES',
        },
      });

      return res.status(201).json({
        message: 'Usuário criado com sucesso!',
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
  }

  // --- PROFILE UPDATE ---
  async updateProfile(req: Request, res: Response) {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const dataToUpdate: any = {};
      if (name) dataToUpdate.name = name;

      if (newPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Senha atual incorreta.' });
        }
        dataToUpdate.password = await bcrypt.hash(newPassword, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      return res.json({
        message: 'Perfil atualizado com sucesso!',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
        },
      });
    } catch (error) {
      console.error('Update Profile error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
  }

  // --- LIST USERS (Admin) ---
  async listUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true, name: true, email: true, role: true, avatar: true, createdAt: true
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
  }

  // --- UPDATE USER (Admin) ---
  async updateUser(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const { name, email, role, password } = req.body;

    try {
      const data: any = { name, email, role };
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data,
      });

      return res.json(updatedUser);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
  }

  // --- DELETE USER (Admin) ---
  async deleteUser(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const requesterId = req.user?.id;

    if (id === requesterId) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }

    try {
      await prisma.user.delete({ where: { id } });
      return res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
      // P2003 = Foreign Key Constraint (caso user tenha logs, etc. - tratar depois com Cascade ou soft delete)
      console.error('Delete User Err:', error);
      return res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
  }
}
