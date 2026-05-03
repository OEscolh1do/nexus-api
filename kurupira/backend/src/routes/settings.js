const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const safeError = (err) =>
  process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const record = await prisma.userSettings.findUnique({
      where: { userId_tenantId: { userId: req.user.id, tenantId: req.user.tenantId } }
    });
    res.json({ success: true, data: record?.data ?? null });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const record = await prisma.userSettings.upsert({
      where: { userId_tenantId: { userId: req.user.id, tenantId: req.user.tenantId } },
      update: { data: req.body },
      create: { userId: req.user.id, tenantId: req.user.tenantId, data: req.body }
    });
    res.json({ success: true, data: record.data });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

module.exports = router;
