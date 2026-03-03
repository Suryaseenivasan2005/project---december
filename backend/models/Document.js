const mongoose = require('mongoose');

/**
 * Document Model
 * Stores metadata for each file uploaded to a user's vault.
 * The actual file lives on disk at `path`; this record is the source of truth.
 */
const DocumentSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        // Original filename as uploaded by the user (sanitized)
        original_name: {
            type: String,
            required: true,
            trim: true,
        },
        // UUID-based name used for storage — prevents collisions & path traversal
        stored_name: {
            type: String,
            required: true,
            unique: true,
        },
        mime_type: {
            type: String,
            required: true,
        },
        // Size in bytes
        size: {
            type: Number,
            required: true,
            min: 0,
        },
        // Auto-categorised: Documents | Images | Work | Others
        category: {
            type: String,
            enum: ['Documents', 'Images', 'Work', 'Others'],
            default: 'Others',
        },
        // Absolute disk path — never exposed to frontend
        path: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

// Per-user ordering index
DocumentSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('Document', DocumentSchema);
