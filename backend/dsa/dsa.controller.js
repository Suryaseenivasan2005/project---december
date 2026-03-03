/**
 * DSA Controller
 *
 * Handles HTTP request/response for DSA endpoints.
 * Delegates all logic to the service layer.
 * Always returns structured JSON and never crashes.
 */
const dsaService = require('./dsa.service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dsa/sync
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Sync LeetCode stats for the authenticated user.
 * Uses 24-hour cache — won't call LeetCode on every request.
 */
const syncStats = async (req, res) => {
    try {
        const result = await dsaService.syncLeetCodeStats(req.user);

        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(200).json({
            success: true,
            fromCache: result.fromCache ?? false,
            stale: result.stale ?? false,
            ...(result.message ? { message: result.message } : {}),
            data: result.data,
        });
    } catch (err) {
        console.error('❌ DSA syncStats error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while syncing DSA stats.',
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dsa/stats
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return cached DSA stats (no LeetCode API call).
 * Includes streak and problems solved today.
 */
const getStats = async (req, res) => {
    try {
        const result = await dsaService.getDsaStats(req.user);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (err) {
        console.error('❌ DSA getStats error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while fetching DSA stats.',
        });
    }
};

module.exports = {
    syncStats,
    getStats,
};
