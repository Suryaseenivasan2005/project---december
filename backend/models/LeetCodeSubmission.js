const mongoose = require('mongoose');

/**
 * LeetCodeSubmission Model
 * Stores individual LeetCode submissions for a user.
 * Uses leetcode_submission_id as a unique key to prevent duplicates.
 */
const LeetCodeSubmissionSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        problem_title: {
            type: String,
            required: true,
            trim: true,
        },
        difficulty: {
            type: String,
            enum: ['EASY', 'MEDIUM', 'HARD', 'UNKNOWN'],
            default: 'UNKNOWN',
        },
        status: {
            type: String,
            trim: true,
            default: 'Unknown',
        },
        submitted_at: {
            type: Date,
            required: true,
        },
        leetcode_submission_id: {
            type: String,
            required: true,
            unique: true, // Prevents duplicate insertions
            index: true,
        },
    },
    { timestamps: true }
);

// Compound index for efficient per-user queries ordered by date
LeetCodeSubmissionSchema.index({ user_id: 1, submitted_at: -1 });

module.exports = mongoose.model('LeetCodeSubmission', LeetCodeSubmissionSchema);
