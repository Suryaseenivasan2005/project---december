/**
 * Vault Repository
 *
 * All MongoDB operations for the Document Vault module.
 * Keeps data access completely isolated from business logic.
 */
const User = require('../models/User');
const Document = require('../models/Document');
const ShareLink = require('../models/ShareLink');

// ──────────────────────────────────────────────────────────────────────────────
// USER / VAULT PIN
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Update vault-PIN-related fields on a user document.
 * Accepts a partial object — only specified keys are updated.
 */
const updateVaultFields = async (userId, fields) => {
    return User.findByIdAndUpdate(userId, { $set: fields }, { new: true });
};

// ──────────────────────────────────────────────────────────────────────────────
// DOCUMENTS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new document record.
 */
const createDocument = async (data) => {
    return Document.create(data);
};

/**
 * Get all documents for a user, newest first.
 */
const getDocumentsByUser = async (userId) => {
    return Document.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Find a single document by ID AND verify it belongs to the given user.
 * Returns null if not found or user doesn't own it — prevents IDOR.
 */
const getDocumentByIdAndUser = async (documentId, userId) => {
    return Document.findOne({ _id: documentId, user_id: userId });
};

/**
 * Delete a document record by ID.
 */
const deleteDocument = async (documentId) => {
    return Document.findByIdAndDelete(documentId);
};

// ──────────────────────────────────────────────────────────────────────────────
// SHARE LINKS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Create a new share link.
 */
const createShareLink = async (data) => {
    return ShareLink.create(data);
};

/**
 * Find a share link by token (for validation at access time).
 * Populates the linked file document.
 */
const getShareLinkByToken = async (token) => {
    return ShareLink.findOne({ share_token: token }).populate('file_id');
};

/**
 * Delete all existing share links for a given file (useful on file delete).
 */
const deleteShareLinksByFile = async (fileId) => {
    return ShareLink.deleteMany({ file_id: fileId });
};

module.exports = {
    updateVaultFields,
    createDocument,
    getDocumentsByUser,
    getDocumentByIdAndUser,
    deleteDocument,
    createShareLink,
    getShareLinkByToken,
    deleteShareLinksByFile,
};
