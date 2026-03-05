const express = require('express');
const router = express.Router();
const IamService = require('./iam.service');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { LoginSchema } = require('./schemas/iam.schemas');

// 🛡️ Helper para Validação Zod (Pode ser movido para middleware global)
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        next(err); // Passa para o Error Handler global
    }
};

// POST /api/v2/iam/login
router.post('/login', validate(LoginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        console.log(`[IAM] Login Attempt: ${username}`);
        
        const result = await IamService.login(username, password);
        
        console.log(`[IAM] Success: ${username}`);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// GET /api/v2/iam/me -> Current User Data & Permissions
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        // req.user is set by authenticateToken middleware
        const permissions = IamService.getPermissionsForRole(req.user.role);
        
        res.json({ 
            success: true, 
            data: {
                user: req.user,
                permissions
            } 
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v2/iam/users -> All Users (for Assignees)
router.get('/users', authenticateToken, async (req, res, next) => {
    try {
        const users = await IamService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
