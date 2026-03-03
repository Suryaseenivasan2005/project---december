/**
 * Vault Controller
 *
 * Thin HTTP layer — validates inputs, calls service, returns JSON.
 * All business logic lives in vault.service.js.
 */
const vaultService = require('./vault.service');

// ── POST /api/vault/set-pin ──────────────────────────────────────────────────
const setPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin) {
            return res.status(400).json({ success: false, message: 'PIN is required.' });
        }

        const result = await vaultService.setPin(req.user, String(pin));
        return res.status(result.success ? 200 : result.statusCode).json(result);
    } catch (err) {
        console.error('❌ setPin error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while setting PIN.' });
    }
};

// ── GET /api/vault/status ─────────────────────────────────────────────────────
/**
 * Returns whether the user has a PIN set (to decide which modal to show).
 * Does NOT require vault auth — just user auth.
 */
const getPinStatus = async (req, res) => {
    try {
        const { vault_pin_hash, vault_lock_until, vault_failed_attempts } = req.user;

        const isLocked =
            vault_lock_until && new Date() < new Date(vault_lock_until);

        let lockRemainingSeconds = 0;
        if (isLocked) {
            lockRemainingSeconds = Math.ceil(
                (new Date(vault_lock_until).getTime() - Date.now()) / 1000
            );
        }

        return res.json({
            success: true,
            data: {
                hasPinSet: !!vault_pin_hash,
                isLockedOut: !!isLocked,
                lockRemainingSeconds,
                failedAttempts: vault_failed_attempts || 0,
                attemptsLeft: Math.max(0, 3 - (vault_failed_attempts || 0)),
            },
        });
    } catch (err) {
        console.error('❌ getPinStatus error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST /api/vault/unlock ───────────────────────────────────────────────────
const unlockVault = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin) {
            return res.status(400).json({ success: false, message: 'PIN is required.' });
        }

        const result = await vaultService.unlockVault(req.user, String(pin));
        return res.status(result.success ? 200 : result.statusCode || 400).json(result);
    } catch (err) {
        console.error('❌ unlockVault error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while unlocking vault.' });
    }
};

// ── POST /api/vault/upload ───────────────────────────────────────────────────
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file was uploaded.' });
        }

        // userId comes from vault JWT session (req.vaultSession) or user auth (req.user)
        const userId = req.vaultSession?.userId || req.user?._id;
        const result = await vaultService.saveFileRecord(userId, req.file);

        return res.status(201).json(result);
    } catch (err) {
        console.error('❌ uploadFile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while uploading file.' });
    }
};

// ── GET /api/vault/files ─────────────────────────────────────────────────────
const getFiles = async (req, res) => {
    try {
        const userId = req.vaultSession?.userId || req.user?._id;
        const result = await vaultService.listFiles(userId);
        return res.json(result);
    } catch (err) {
        console.error('❌ getFiles error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching files.' });
    }
};

// ── DELETE /api/vault/:id ────────────────────────────────────────────────────
const deleteFile = async (req, res) => {
    try {
        const userId = req.vaultSession?.userId || req.user?._id;
        const result = await vaultService.deleteFile(userId, req.params.id);
        return res.status(result.success ? 200 : result.statusCode || 400).json(result);
    } catch (err) {
        console.error('❌ deleteFile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while deleting file.' });
    }
};

// ── POST /api/vault/share/:id ────────────────────────────────────────────────
const shareFile = async (req, res) => {
    try {
        const userId = req.vaultSession?.userId || req.user?._id;
        // Build the base URL from the incoming request
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const result = await vaultService.generateShareLink(userId, req.params.id, baseUrl);
        return res.status(result.success ? 200 : result.statusCode || 400).json(result);
    } catch (err) {
        console.error('❌ shareFile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while generating share link.' });
    }
};

// ── GET /api/vault/shared/:token  (public — no auth required) ───────────────
const accessSharedFile = async (req, res) => {
    try {
        const result = await vaultService.resolveSharedFile(req.params.token);

        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                success: false,
                message: result.message,
            });
        }

        // Stream file directly — Content-Disposition: inline for browser preview
        res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(result.fileName)}"`
        );
        res.sendFile(result.filePath, { root: '/' });
    } catch (err) {
        console.error('❌ accessSharedFile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while serving shared file.' });
    }
};

// ── GET /api/vault/view/:id (Requires Vault Auth) ───────────────────────────
const viewFileContent = async (req, res) => {
    try {
        const userId = req.vaultSession?.userId || req.user?._id;
        const result = await vaultService.getFileForPreview(userId, req.params.id);

        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                success: false,
                message: result.message,
            });
        }

        // Stream file directly
        res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(result.fileName)}"`
        );
        res.sendFile(result.filePath, { root: '/' });
    } catch (err) {
        console.error('❌ viewFileContent error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while opening file.' });
    }
};

module.exports = {
    setPin,
    getPinStatus,
    unlockVault,
    uploadFile,
    getFiles,
    deleteFile,
    shareFile,
    accessSharedFile,
    viewFileContent,
};
