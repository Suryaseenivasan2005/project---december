const mongoose = require('mongoose');

/**
 * ShareLink Model
 * Stores time-limited, tokenised share links for vault files.
 * Token is a cryptographically random UUID — never guessable.
 */
const ShareLinkSchema = new mongoose.Schema(
    {
        file_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
            index: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Random UUID used in the shareable URL
        share_token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        // UTC timestamp when this link expires (default: 24 h from creation)
        expires_at: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

// TTL index: MongoDB will auto-delete expired share links after expiry
ShareLinkSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ShareLink', ShareLinkSchema);
