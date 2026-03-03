const mongoose = require('mongoose');

/**
 * User Model
 * Stores basic user info, LeetCode username, and vault security fields.
 */
const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        leetcode_username: {
            type: String,
            trim: true,
            default: null,
        },

        // ── Document Vault security fields ────────────────────────────
        vault_pin_hash: {
            type: String,
            default: null,  // null = PIN not yet set
        },
        vault_failed_attempts: {
            type: Number,
            default: 0,
        },
        vault_lock_until: {
            type: Date,
            default: null,  // null = not locked
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
