// /backend/src/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Chave secreta para assinar o token (Idealmente deve estar no .env)
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_key_2024';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Por segurança, a mensagem é genérica para não revelar que o email existe
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 2. Comparar a senha enviada com o hash no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 3. Gerar Token JWT
    // O token contém o ID e o Cargo (Role), expira em 24h
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Retornar Token e Dados do Usuário (sem a senha)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

// Função auxiliar para Criar Usuário (seed inicial ou registro)
// Use isso para criar seu primeiro usuário via Postman se ainda não tiver
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Criptografar senha antes de salvar
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'SALES'
            }
        });

        res.status(201).json({ message: "Usuário criado!", userId: user.id });
    } catch (error) {
        res.status(400).json({ error: "Erro ao criar usuário (Email já existe?)" });
    }
};