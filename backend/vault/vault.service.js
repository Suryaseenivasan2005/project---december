/**
 * Vault Service
 *
 * All business logic for the Document Vault:
 *   - PIN management (set, verify, lockout)
 *   - File upload processing and auto-categorisation
 *   - File listing, deletion (disk + DB)
 *   - Share link generation and validation
 *
 * SECURITY CONTRACTS:
 *   - PIN hashed with bcrypt (rounds: 12) — never stored plain
 *   - Max 3 failed attempts → 5-minute lockout
 *   - Vault unlock session JWT expires in 10 minutes
 *   - Filenames sanitised via path.basename to prevent traversal
 *   - Ownership verified on every file operation
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const repo = require('./vault.repository');

// ── Constants ────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 5;
const VAULT_TOKEN_EXPIRES_IN = '10m';
const SHARE_LINK_HOURS = 24;

const JWT_SECRET = () =>
    process.env.VAULT_JWT_SECRET || process.env.JWT_SECRET || 'vault-fallback-secret';

// ── Auto-categorisation map ───────────────────────────────────────────────────
const categorise = (mimetype, originalname) => {
    const ext = path.extname(originalname).toLowerCase();
    if (['.pdf'].includes(ext) || mimetype === 'application/pdf') return 'Documents';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) return 'Images';
    if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) return 'Work';
    return 'Others';
};

// ── Helper: format file size ──────────────────────────────────────────────────
const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ─────────────────────────────────────────────────────────────────────────────
// PIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Set vault PIN for the first time.
 * Rejects if a PIN is already set (user must use change-PIN flow instead).
 */
const setPin = async (user, pin) => {
    // Validate: must be exactly 6 digits
    if (!/^\d{6}$/.test(pin)) {
        return { success: false, statusCode: 400, message: 'PIN must be exactly 6 digits.' };
    }

    // Prevent overwriting an existing PIN via this endpoint
    if (user.vault_pin_hash) {
        return {
            success: false,
            statusCode: 400,
            message: 'Vault PIN is already set. Use the change-PIN flow instead.',
        };
    }

    const hash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
    await repo.updateVaultFields(user._id, {
        vault_pin_hash: hash,
        vault_failed_attempts: 0,
        vault_lock_until: null,
    });

    return { success: true, message: 'Vault PIN set successfully.' };
};

/**
 * Unlock the vault by verifying the PIN.
 * Handles lockout, failed-attempt counting, and JWT issuance.
 */
const unlockVault = async (user, pin) => {
    // ── Check if vault is currently locked out ────────────────────────
    if (user.vault_lock_until && new Date() < new Date(user.vault_lock_until)) {
        const remaining = Math.ceil(
            (new Date(user.vault_lock_until).getTime() - Date.now()) / 1000 / 60
        );
        return {
            success: false,
            statusCode: 429,
            locked: true,
            message: `Too many wrong attempts. Vault locked for ${remaining} more minute(s).`,
        };
    }

    // ── If lock period has expired, reset it cleanly ──────────────────
    if (user.vault_lock_until && new Date() >= new Date(user.vault_lock_until)) {
        await repo.updateVaultFields(user._id, {
            vault_failed_attempts: 0,
            vault_lock_until: null,
        });
        user.vault_failed_attempts = 0;
        user.vault_lock_until = null;
    }

    // ── PIN not set yet ───────────────────────────────────────────────
    if (!user.vault_pin_hash) {
        return {
            success: false,
            statusCode: 400,
            pinNotSet: true,
            message: 'Vault PIN has not been set. Please set a PIN first.',
        };
    }

    // ── Verify PIN against hash ───────────────────────────────────────
    const correct = await bcrypt.compare(String(pin), user.vault_pin_hash);

    if (!correct) {
        const newAttempts = (user.vault_failed_attempts || 0) + 1;
        const updates = { vault_failed_attempts: newAttempts };

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
            updates.vault_lock_until = lockUntil;
            updates.vault_failed_attempts = 0;
            await repo.updateVaultFields(user._id, updates);
            return {
                success: false,
                statusCode: 429,
                locked: true,
                message: `Too many wrong attempts. Vault locked for ${LOCKOUT_MINUTES} minutes.`,
            };
        }

        await repo.updateVaultFields(user._id, updates);
        const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
        return {
            success: false,
            statusCode: 401,
            attemptsLeft: remaining,
            message: `Incorrect PIN. ${remaining} attempt(s) remaining.`,
        };
    }

    // ── PIN correct — reset attempts and issue vault session JWT ──────
    await repo.updateVaultFields(user._id, {
        vault_failed_attempts: 0,
        vault_lock_until: null,
    });

    const vaultToken = jwt.sign(
        { userId: String(user._id), type: 'vault_session' },
        JWT_SECRET(),
        { expiresIn: VAULT_TOKEN_EXPIRES_IN }
    );

    return {
        success: true,
        vaultToken,
        expiresIn: 600, // seconds = 10 min
        message: 'Vault unlocked successfully.',
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// FILE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save uploaded file metadata to the database.
 * multer's diskStorage has already written the file to disk.
 */
const saveFileRecord = async (userId, file) => {
    const category = categorise(file.mimetype, file.originalname);

    const doc = await repo.createDocument({
        user_id: userId,
        original_name: path.basename(file.originalname), // sanitised
        stored_name: file.filename,
        mime_type: file.mimetype,
        size: file.size,
        category,
        path: file.path,
    });

    return {
        success: true,
        data: {
            id: doc._id,
            name: doc.original_name,
            size: formatSize(doc.size),
            sizeBytes: doc.size,
            category: doc.category,
            mimeType: doc.mime_type,
            uploadedAt: doc.createdAt,
        },
    };
};

/**
 * Return all documents for the vault user.
 * Never returns the `path` field (server-side only).
 */
const listFiles = async (userId) => {
    const docs = await repo.getDocumentsByUser(userId);

    return {
        success: true,
        data: docs.map((d) => ({
            id: d._id,
            name: d.original_name,
            size: formatSize(d.size),
            sizeBytes: d.size,
            category: d.category,
            mimeType: d.mime_type,
            uploadedAt: d.createdAt,
        })),
    };
};

/**
 * Delete a file — removes DB record AND physical file.
 * Also removes any share links for the file.
 */
const deleteFile = async (userId, documentId) => {
    const doc = await repo.getDocumentByIdAndUser(documentId, userId);

    if (!doc) {
        return {
            success: false,
            statusCode: 404,
            message: 'File not found or you do not have permission to delete it.',
        };
    }

    // Delete share links first
    await repo.deleteShareLinksByFile(documentId);

    // Remove physical file from disk
    try {
        if (fs.existsSync(doc.path)) {
            fs.unlinkSync(doc.path);
        }
    } catch (fsErr) {
        console.warn(`⚠️  Could not delete file from disk: ${doc.path}`, fsErr.message);
        // Continue — still remove DB record
    }

    await repo.deleteDocument(documentId);

    return { success: true, message: 'File deleted successfully.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARE LINKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a time-limited share link for a file.
 * Returns the full URL for the recipient to access the file.
 */
const generateShareLink = async (userId, documentId, baseUrl) => {
    const doc = await repo.getDocumentByIdAndUser(documentId, userId);

    if (!doc) {
        return {
            success: false,
            statusCode: 404,
            message: 'File not found or you do not have permission to share it.',
        };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + SHARE_LINK_HOURS * 60 * 60 * 1000);

    await repo.createShareLink({
        file_id: documentId,
        user_id: userId,
        share_token: token,
        expires_at: expiresAt,
    });

    const shareUrl = `${baseUrl}/api/vault/shared/${token}`;

    return {
        success: true,
        data: {
            shareUrl,
            token,
            expiresAt,
            fileName: doc.original_name,
        },
    };
};

/**
 * Validate a share token and return the file path for streaming.
 * Returns error if token not found or expired.
 */
const resolveSharedFile = async (token) => {
    const link = await repo.getShareLinkByToken(token);

    if (!link) {
        return { success: false, statusCode: 404, message: 'Share link not found.' };
    }

    if (new Date() > new Date(link.expires_at)) {
        return { success: false, statusCode: 403, message: 'This share link has expired.' };
    }

    const file = link.file_id; // populated Document
    if (!file || !fs.existsSync(file.path)) {
        return { success: false, statusCode: 404, message: 'The shared file no longer exists.' };
    }

    return {
        success: true,
        filePath: file.path,
        fileName: file.original_name,
        mimeType: file.mime_type,
    };
};

/**
 * Return file path and metadata for a logged-in user to preview their own file.
 */
const getFileForPreview = async (userId, documentId) => {
    const doc = await repo.getDocumentByIdAndUser(documentId, userId);

    if (!doc) {
        return {
            success: false,
            statusCode: 404,
            message: 'File not found or you do not have permission to view it.',
        };
    }

    if (!fs.existsSync(doc.path)) {
        return { success: false, statusCode: 404, message: 'File is missing from disk.' };
    }

    return {
        success: true,
        filePath: doc.path,
        fileName: doc.original_name,
        mimeType: doc.mime_type,
    };
};

module.exports = {
    setPin,
    unlockVault,
    saveFileRecord,
    listFiles,
    deleteFile,
    generateShareLink,
    resolveSharedFile,
    getFileForPreview,
};
