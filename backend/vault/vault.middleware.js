/**
 * Vault Middleware
 *
 * Verifies the short-lived vault session JWT that was issued on PIN unlock.
 * This is separate from general user auth — a valid user session does NOT
 * automatically grant vault access. The user must also pass their PIN.
 *
 * Token lifetime: 10 minutes (see VAULT_TOKEN_EXPIRES_IN in vault.service.js)
 *
 * Expected header:
 *   Authorization: Bearer <vault_token>
 *     -- OR --
 *   x-vault-token: <vault_token>
 */
const jwt = require('jsonwebtoken');

const vaultAuth = (req, res, next) => {
    try {
        // Accept token from Authorization Bearer OR x-vault-token header
        let token = null;

        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        } else if (req.headers['x-vault-token']) {
            token = req.headers['x-vault-token'];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                vaultLocked: true,
                message: 'Vault is locked. Please enter your PIN to continue.',
            });
        }

        // Verify the vault JWT (signed with VAULT_JWT_SECRET)
        const secret = process.env.VAULT_JWT_SECRET || process.env.JWT_SECRET || 'vault-fallback-secret';
        const decoded = jwt.verify(token, secret);

        // Attach vault session info to request
        req.vaultSession = {
            userId: decoded.userId,
            unlockedAt: decoded.iat,
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                vaultLocked: true,
                tokenExpired: true,
                message: 'Vault session expired. Please enter your PIN again.',
            });
        }
        return res.status(401).json({
            success: false,
            vaultLocked: true,
            message: 'Invalid vault token. Please unlock the vault first.',
        });
    }
};

module.exports = vaultAuth;
