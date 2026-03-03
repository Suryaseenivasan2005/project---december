/**
 * DSA Routes
 *
 * Mounts DSA endpoints under /api/dsa (registered in server.js).
 * All routes require authentication via the auth middleware.
 *
 * Endpoints:
 *   POST /api/dsa/sync   — Sync LeetCode stats (24-hour cache)
 *   GET  /api/dsa/stats  — Fetch cached stats + streak
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { syncStats, getStats } = require('./dsa.controller');

// POST /api/dsa/sync
router.post('/sync', auth, syncStats);

// GET /api/dsa/stats
router.get('/stats', auth, getStats);

module.exports = router;
