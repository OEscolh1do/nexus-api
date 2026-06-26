/**
 * routes/symbolCatalog.js
 * CRUD para a biblioteca de símbolos IEC do SymbolEditorCanvas.
 *
 * Rotas:
 *   GET    /api/v1/symbol-catalog          — listar entradas do tenant (ativos)
 *   GET    /api/v1/symbol-catalog/:id      — buscar uma entrada
 *   POST   /api/v1/symbol-catalog          — criar nova entrada
 *   PUT    /api/v1/symbol-catalog/:id      — substituir elementos/cssVars/nome
 *   DELETE /api/v1/symbol-catalog/:id      — soft-delete
 *
 * Multi-tenancy: todas as queries filtram por req.user.tenantId.
 * Soft-delete:   registros com deletedAt != null são excluídos das listagens.
 */

const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const safeError = (err) =>
  process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

const router = Router();

// ── Schemas de validação (Zod 4) ─────────────────────────────────────────────

const SymElemSchema = z.record(z.unknown()); // estrutura aberta — validação detalhada é responsabilidade do frontend

const CreateSchema = z.object({
  name:     z.string().min(1).max(120),
  symId:    z.string().min(1).max(60),
  vbW:      z.number().int().positive(),
  vbH:      z.number().int().positive(),
  elements: z.array(SymElemSchema),
  cssVars:  z.record(z.string()).optional().nullable(),
});

const UpdateSchema = CreateSchema.partial();

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        issues: result.error.issues,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

// ── GET / — listar entradas do tenant ────────────────────────────────────────

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { symId } = req.query;
    const entries = await prisma.symbolCatalogEntry.findMany({
      where: {
        tenantId:  req.user.tenantId,
        deletedAt: null,
        ...(symId ? { symId: String(symId) } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: safeError(err) });
  }
});

// ── GET /:id — buscar uma entrada ────────────────────────────────────────────

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await prisma.symbolCatalogEntry.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null },
    });
    if (!entry) return res.status(404).json({ success: false, error: 'Não encontrado' });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: safeError(err) });
  }
});

// ── POST / — criar nova entrada ───────────────────────────────────────────────

router.post('/', authenticateToken, validate(CreateSchema), async (req, res) => {
  try {
    const { name, symId, vbW, vbH, elements, cssVars } = req.validatedBody;
    const entry = await prisma.symbolCatalogEntry.create({
      data: {
        tenantId:  req.user.tenantId,
        createdBy: req.user.id,
        name,
        symId,
        vbW,
        vbH,
        elements,
        cssVars:   cssVars ?? null,
      },
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: safeError(err) });
  }
});

// ── PUT /:id — atualizar entrada ─────────────────────────────────────────────

router.put('/:id', authenticateToken, validate(UpdateSchema), async (req, res) => {
  try {
    // Garante que a entrada pertence ao tenant antes de atualizar
    const existing = await prisma.symbolCatalogEntry.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Não encontrado' });

    const entry = await prisma.symbolCatalogEntry.update({
      where: { id: req.params.id },
      data: req.validatedBody,
    });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: safeError(err) });
  }
});

// ── DELETE /:id — soft-delete ────────────────────────────────────────────────

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await prisma.symbolCatalogEntry.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Não encontrado' });

    await prisma.symbolCatalogEntry.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedBy: req.user.id },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: safeError(err) });
  }
});

module.exports = router;
