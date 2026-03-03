/**
 * DSA Service
 *
 * Contains all business logic for syncing and reading LeetCode data.
 * - Handles LeetCode GraphQL API calls (server-side only)
 * - Parses response safely, defaulting null values to 0
 * - Calculates streak from submission history
 * - Never crashes — all errors are caught and returned as structured results
 */
const https = require('https');
const repo = require('./dsa.repository');

// ─── LeetCode GraphQL endpoint ─────────────────────────────────────────────
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

// ─── GraphQL query to fetch user stats + recent submissions ──────────────
const LEETCODE_QUERY = `
query userProfile($username: String!) {
  matchedUser(username: $username) {
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    profile {
      ranking
    }
  }
  recentSubmissionList(username: $username) {
    id
    title
    statusDisplay
    timestamp
  }
}
`;

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Make a POST request to LeetCode's GraphQL API.
 * Uses native https module — no external dependencies required.
 *
 * @param {string} username - LeetCode username
 * @returns {Promise<object>} Parsed JSON response
 */
const fetchLeetCodeData = (username) => {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            query: LEETCODE_QUERY,
            variables: { username },
        });

        const options = {
            hostname: 'leetcode.com',
            path: '/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                // Required to avoid LeetCode rejecting the request
                'User-Agent': 'Mozilla/5.0 (compatible; Jarvis-DSA-Tracker/1.0)',
                Referer: 'https://leetcode.com',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (parseErr) {
                    reject(new Error('Failed to parse LeetCode response'));
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`Network error contacting LeetCode: ${err.message}`));
        });

        // Timeout after 15 seconds
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('LeetCode API request timed out'));
        });

        req.write(body);
        req.end();
    });
};

/**
 * Safely extract integer value from LeetCode's acSubmissionNum array.
 *
 * @param {Array} arr - acSubmissionNum array from GraphQL response
 * @param {string} difficulty - e.g. 'All', 'Easy', 'Medium', 'Hard'
 * @returns {number} count or 0 if missing/null
 */
const extractCount = (arr, difficulty) => {
    if (!Array.isArray(arr)) return 0;
    const entry = arr.find((item) => item?.difficulty === difficulty);
    return entry?.count ?? 0;
};

/**
 * Map LeetCode difficulty string to our enum format.
 * LeetCode returns lowercase or titlecase; normalise to uppercase.
 */
const normaliseDifficulty = (difficulty) => {
    if (!difficulty) return 'UNKNOWN';
    const upper = difficulty.toUpperCase();
    if (['EASY', 'MEDIUM', 'HARD'].includes(upper)) return upper;
    return 'UNKNOWN';
};

/**
 * Calculate the current consecutive-day solving streak.
 *
 * Logic:
 * - Look at each submission's date (UTC day).
 * - Count how many consecutive calendar days (going backwards from today)
 *   had at least one Accepted submission.
 * - If no accepted submissions → return 0.
 *
 * @param {Array} acceptedSubmissions - sorted desc by submitted_at
 * @returns {number} streak in days
 */
const calculateStreak = (acceptedSubmissions) => {
    if (!acceptedSubmissions || acceptedSubmissions.length === 0) return 0;

    // Build a Set of unique "YYYY-MM-DD" strings (UTC) that have submissions
    const solvedDays = new Set(
        acceptedSubmissions.map((s) => {
            const d = new Date(s.submitted_at);
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        })
    );

    // Walk backwards from today, counting consecutive days
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setUTCDate(checkDate.getUTCDate() - i);
        const key = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`;

        if (solvedDays.has(key)) {
            streak++;
        } else {
            // On day 0 (today), missing is OK — check yesterday instead
            if (i === 0) continue;
            break; // Streak broken
        }
    }

    return streak;
};

/**
 * Count accepted submissions for today (UTC).
 */
const countSolvedToday = (acceptedSubmissions) => {
    if (!acceptedSubmissions || acceptedSubmissions.length === 0) return 0;
    const todayKey = (() => {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    })();

    return acceptedSubmissions.filter((s) => {
        const d = new Date(s.submitted_at);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        return key === todayKey;
    }).length;
};

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC SERVICE METHODS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Sync LeetCode stats for a given user.
 *
 * Steps:
 * 1. Validate leetcode_username exists on the user.
 * 2. Check 24-hour cache — return cached data if fresh.
 * 3. Call LeetCode GraphQL API.
 * 4. Parse response safely (null-safe).
 * 5. Upsert stats + insert new submissions.
 * 6. Return structured JSON.
 *
 * @param {object} user - Mongoose User document
 * @returns {object} { success, data?, message? }
 */
const syncLeetCodeStats = async (user) => {
    // ── 1. Validate username ────────────────────────────────────────────
    const username = user.leetcode_username;
    if (!username || !username.trim()) {
        return {
            success: false,
            statusCode: 400,
            message: 'LeetCode username is not set on your profile. Please add it in settings.',
        };
    }

    // ── 2. Check cache ──────────────────────────────────────────────────
    const existingStats = await repo.getStats(user._id);
    if (repo.isCacheValid(existingStats)) {
        // Return cached stats with recent submissions
        const submissions = await repo.getSubmissions(user._id, 10);
        return {
            success: true,
            fromCache: true,
            data: buildResponseData(existingStats, submissions),
        };
    }

    // ── 3. Fetch from LeetCode ──────────────────────────────────────────
    let apiResponse;
    try {
        apiResponse = await fetchLeetCodeData(username.trim());
    } catch (networkErr) {
        // If we have stale cache, return it as a fallback
        if (existingStats) {
            const submissions = await repo.getSubmissions(user._id, 10);
            return {
                success: true,
                fromCache: true,
                stale: true,
                message: 'LeetCode API unreachable. Showing cached data.',
                data: buildResponseData(existingStats, submissions),
            };
        }
        return {
            success: false,
            statusCode: 503,
            message: `Unable to reach LeetCode: ${networkErr.message}`,
        };
    }

    // ── 4. Parse response safely ────────────────────────────────────────
    const matchedUser = apiResponse?.data?.matchedUser;
    if (!matchedUser) {
        return {
            success: false,
            statusCode: 404,
            message: `LeetCode user "${username}" not found. Please check your username.`,
        };
    }

    const acNums = matchedUser?.submitStats?.acSubmissionNum ?? [];
    const ranking = matchedUser?.profile?.ranking ?? null;
    const recentList = apiResponse?.data?.recentSubmissionList ?? [];

    const statsData = {
        total_solved: extractCount(acNums, 'All'),
        easy_solved: extractCount(acNums, 'Easy'),
        medium_solved: extractCount(acNums, 'Medium'),
        hard_solved: extractCount(acNums, 'Hard'),
        ranking: ranking && ranking > 0 ? ranking : null,
    };

    // ── 5a. Upsert stats ────────────────────────────────────────────────
    const updatedStats = await repo.upsertStats(user._id, statsData);

    // ── 5b. Insert new submissions (deduplication) ──────────────────────
    if (recentList.length > 0) {
        const existingIds = await repo.getExistingSubmissionIds(user._id);

        const newSubmissions = recentList
            .filter((s) => s?.id && !existingIds.has(String(s.id)))
            .map((s) => ({
                user_id: user._id,
                problem_title: s.title || 'Unknown Problem',
                difficulty: 'UNKNOWN', // LeetCode's recentSubmissionList doesn't return difficulty
                status: s.statusDisplay || 'Unknown',
                submitted_at: new Date(parseInt(s.timestamp, 10) * 1000), // Unix → JS Date
                leetcode_submission_id: String(s.id),
            }));

        await repo.insertNewSubmissions(newSubmissions);
    }

    // ── 6. Return response ──────────────────────────────────────────────
    const submissions = await repo.getSubmissions(user._id, 10);
    return {
        success: true,
        fromCache: false,
        data: buildResponseData(updatedStats, submissions),
    };
};

/**
 * Return cached DSA stats for a user (no sync).
 * Also computes streak and problems-solved-today from submission history.
 *
 * @param {object} user - Mongoose User document
 * @returns {object} { success, data?, message? }
 */
const getDsaStats = async (user) => {
    const stats = await repo.getStats(user._id);

    if (!stats) {
        // User has never synced — return zeroed-out response
        return {
            success: true,
            data: {
                totalSolved: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                ranking: null,
                streak: 0,
                problemsSolvedToday: 0,
                lastSynced: null,
                neverSynced: true,
            },
        };
    }

    // Fetch accepted submissions for streak + today count
    const accepted = await repo.getAcceptedSubmissions(user._id);
    const streak = calculateStreak(accepted);
    const problemsSolvedToday = countSolvedToday(accepted);

    return {
        success: true,
        data: {
            totalSolved: stats.total_solved ?? 0,
            easy: stats.easy_solved ?? 0,
            medium: stats.medium_solved ?? 0,
            hard: stats.hard_solved ?? 0,
            ranking: stats.ranking ?? null,
            streak,
            problemsSolvedToday,
            lastSynced: stats.last_synced_at ?? null,
            neverSynced: false,
        },
    };
};

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE BUILDER
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build the structured JSON response from stats + submissions.
 */
const buildResponseData = (stats, submissions) => ({
    totalSolved: stats?.total_solved ?? 0,
    easy: stats?.easy_solved ?? 0,
    medium: stats?.medium_solved ?? 0,
    hard: stats?.hard_solved ?? 0,
    ranking: stats?.ranking ?? null,
    lastSynced: stats?.last_synced_at ?? null,
    recentSubmissions: (submissions || []).map((s) => ({
        title: s.problem_title,
        status: s.status,
        submittedAt: s.submitted_at,
    })),
});

module.exports = {
    syncLeetCodeStats,
    getDsaStats,
};
