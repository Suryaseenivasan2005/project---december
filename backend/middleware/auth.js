/**
 * Auth Middleware
 *
 * Validates the authenticated user before DSA routes.
 * This is a simple middleware that expects a user_id in the request header
 * (x-user-id). Swap this out with your real JWT implementation when ready.
 *
 * Usage:
 *   const auth = require('../middleware/auth');
 *   router.post('/sync', auth, controller.sync);
 *
 * In production, replace header-based auth with JWT verification:
 *   const decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
 *   req.user = await User.findById(decoded.id);
 */
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // ── Read user_id from request header ──────────────────────────
        // Replace this block with your real JWT logic if needed.
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No user ID provided',
            });
        }

        // ── Validate user exists in DB ─────────────────────────────────
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not found',
            });
        }

        // ── Attach user to request object ──────────────────────────────
        req.user = user;
        next();
    } catch (err) {
        // Handle invalid ObjectId format gracefully
        if (err.name === 'CastError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid user ID format',
            });
        }
        console.error('❌ Auth middleware error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
        });
    }
};

module.exports = auth;
