"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        res.status(200).json({ message: 'Get vendors endpoint - not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (_req, res) => {
    try {
        res.status(200).json({ message: 'Get vendor by ID endpoint - not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', async (_req, res) => {
    try {
        res.status(200).json({ message: 'Create vendor endpoint - not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', async (_req, res) => {
    try {
        res.status(200).json({ message: 'Update vendor endpoint - not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', async (_req, res) => {
    try {
        res.status(200).json({ message: 'Delete vendor endpoint - not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=vendors.js.map