/**
 * Vault Routes
 *
 * All routes under /api/vault (registered in server.js).
 *
 * Public routes (no vault auth):
 *   GET  /api/vault/shared/:token     — serve shared file by token
 *
 * User-auth-only routes (need x-user-id header):
 *   GET  /api/vault/status            — check if PIN is set, lockout state
 *   POST /api/vault/set-pin           — create vault PIN (first time only)
 *   POST /api/vault/unlock            — verify PIN → receive vault JWT
 *
 * Vault-auth routes (need user auth + vault JWT):
 *   POST   /api/vault/upload          — upload a file
 *   GET    /api/vault/files           — list all files
 *   DELETE /api/vault/:id             — delete a file
 *   POST   /api/vault/share/:id       — generate share link
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const auth = require('../middleware/auth');
const vaultAuth = require('./vault.middleware');
const ctrl = require('./vault.controller');

// ── Upload directory setup ───────────────────────────────────────────────────
// Files are stored OUTSIDE the public directory — never directly accessible via URL
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'vault');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Multer configuration ─────────────────────────────────────────────────────
const ALLOWED_MIMETYPES = new Set([
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // UUID-based filename prevents collisions and path traversal
        cb(null, `${uuidv4()}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type "${file.mimetype}" is not allowed.`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Multer error handler ──────────────────────────────────────────────────────
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File exceeds 10 MB limit.' });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// PUBLIC — serve shared file (no auth required)
router.get('/shared/:token', ctrl.accessSharedFile);

// USER AUTH ONLY — PIN management
router.get('/status', auth, ctrl.getPinStatus);
router.post('/set-pin', auth, ctrl.setPin);
router.post('/unlock', auth, ctrl.unlockVault);

// VAULT AUTH — file operations (requires both user + vault token)
router.post(
    '/upload',
    auth,
    vaultAuth,
    upload.single('file'),
    handleMulterError,
    ctrl.uploadFile
);
router.get('/files', auth, vaultAuth, ctrl.getFiles);
router.get('/view/:id', auth, vaultAuth, ctrl.viewFileContent);
router.delete('/:id', auth, vaultAuth, ctrl.deleteFile);
router.post('/share/:id', auth, vaultAuth, ctrl.shareFile);

module.exports = router;
