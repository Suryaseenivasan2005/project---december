const mongoose = require('mongoose');

/**
 * LeetCodeStats Model
 * Stores aggregated LeetCode statistics for a user.
 * Cached for up to 24 hours to avoid hammering the LeetCode API.
 */
const LeetCodeStatsSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One stats document per user
            index: true,
        },
        total_solved: {
            type: Number,
            default: 0,
            min: 0,
        },
        easy_solved: {
            type: Number,
            default: 0,
            min: 0,
        },
        medium_solved: {
            type: Number,
            default: 0,
            min: 0,
        },
        hard_solved: {
            type: Number,
            default: 0,
            min: 0,
        },
        ranking: {
            type: Number,
            default: null,
            nullable: true,
        },
        last_synced_at: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('LeetCodeStats', LeetCodeStatsSchema);
