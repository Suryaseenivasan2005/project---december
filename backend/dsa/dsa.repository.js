/**
 * DSA Repository
 *
 * Handles all database operations for the DSA/LeetCode module.
 * Keeps DB access isolated from business logic in the service layer.
 */
const LeetCodeStats = require('../models/LeetCodeStats');
const LeetCodeSubmission = require('../models/LeetCodeSubmission');

// ─── Cache duration: 24 hours in milliseconds ──────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ────────────────────────────────────────────────────────────────────────────
// STATS OPERATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get cached stats for a user.
 * Returns null if no stats exist or cache has expired.
 */
const getStats = async (userId) => {
    const stats = await LeetCodeStats.findOne({ user_id: userId });
    return stats || null;
};

/**
 * Check if the cached stats are still valid (within 24 hours).
 */
const isCacheValid = (stats) => {
    if (!stats || !stats.last_synced_at) return false;
    const age = Date.now() - new Date(stats.last_synced_at).getTime();
    return age < CACHE_TTL_MS;
};

/**
 * Upsert LeetCode stats for a user.
 * Creates a new record if none exists, or updates the existing one.
 */
const upsertStats = async (userId, data) => {
    const stats = await LeetCodeStats.findOneAndUpdate(
        { user_id: userId },
        {
            $set: {
                user_id: userId,
                total_solved: data.total_solved ?? 0,
                easy_solved: data.easy_solved ?? 0,
                medium_solved: data.medium_solved ?? 0,
                hard_solved: data.hard_solved ?? 0,
                ranking: data.ranking ?? null,
                last_synced_at: new Date(),
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return stats;
};

// ────────────────────────────────────────────────────────────────────────────
// SUBMISSION OPERATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get existing submission IDs for a user (to skip duplicates).
 */
const getExistingSubmissionIds = async (userId) => {
    const submissions = await LeetCodeSubmission.find(
        { user_id: userId },
        { leetcode_submission_id: 1, _id: 0 }
    ).lean();
    return new Set(submissions.map((s) => s.leetcode_submission_id));
};

/**
 * Bulk insert new submissions, ignoring duplicates via ordered:false.
 */
const insertNewSubmissions = async (submissions) => {
    if (!submissions || submissions.length === 0) return 0;
    try {
        const result = await LeetCodeSubmission.insertMany(submissions, {
            ordered: false, // Continue on duplicate key errors
        });
        return result.length;
    } catch (err) {
        // E11000 = duplicate key error — safely ignore
        if (err.code === 11000 || (err.writeErrors && err.insertedDocs)) {
            return err.insertedDocs ? err.insertedDocs.length : 0;
        }
        throw err;
    }
};

/**
 * Get all submissions for a user, sorted by date descending.
 */
const getSubmissions = async (userId, limit = 20) => {
    return LeetCodeSubmission.find({ user_id: userId })
        .sort({ submitted_at: -1 })
        .limit(limit)
        .lean();
};

/**
 * Get all ACCEPTED submissions for a user (for streak calculation).
 */
const getAcceptedSubmissions = async (userId) => {
    return LeetCodeSubmission.find({
        user_id: userId,
        status: 'Accepted',
    })
        .sort({ submitted_at: -1 })
        .lean();
};

module.exports = {
    getStats,
    isCacheValid,
    upsertStats,
    getExistingSubmissionIds,
    insertNewSubmissions,
    getSubmissions,
    getAcceptedSubmissions,
    CACHE_TTL_MS,
};
