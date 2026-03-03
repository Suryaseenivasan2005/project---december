import { useState, useEffect, useCallback } from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

// IMPORTANT: Replace this with your real auth user ID once you have JWT auth.
// For now the middleware reads x-user-id from the request header.
// You can create a test user via MongoDB and paste the _id here.
const DEV_USER_ID = localStorage.getItem('jarvis_user_id') || '';

const headers = () => ({
    'Content-Type': 'application/json',
    'x-user-id': DEV_USER_ID,
});

// ─── Difficulty badge helper ──────────────────────────────────────────────────
const difficultyClass = (d = '') => {
    const map = { easy: 'easy', medium: 'medium', hard: 'hard', EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' };
    return map[d] || 'pending';
};

// ─── Circular progress ring ──────────────────────────────────────────────────
function RingProgress({ value = 0, max = 100, color = 'var(--accent)', size = 80, label = '', subLabel = '' }) {
    const r = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    const pct = max > 0 ? Math.min(value / max, 1) : 0;
    const dash = pct * circ;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
            </svg>
            {label && (
                <div style={{ textAlign: 'center', marginTop: -4 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>{label}</div>
                    {subLabel && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>{subLabel}</div>}
                </div>
            )}
        </div>
    );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
    return (
        <div style={{
            width, height, borderRadius: radius,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            ...style,
        }} />
    );
}

// ─── Pulse dot ───────────────────────────────────────────────────────────────
function PulseDot({ color = 'var(--success)' }) {
    return (
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DSA PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DSA() {
    const [stats, setStats] = useState(null);
    const [syncData, setSyncData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);
    const [syncMessage, setSyncMessage] = useState('');
    const [lastSyncedLabel, setLastSyncedLabel] = useState('');
    const [userId, setUserId] = useState(DEV_USER_ID);

    // ── Format last synced time ─────────────────────────────────────────
    const formatSynced = (ts) => {
        if (!ts) return 'Never synced';
        const diff = (Date.now() - new Date(ts).getTime()) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    // ── Fetch cached stats from GET /api/dsa/stats ──────────────────────
    const fetchStats = useCallback(async (uid = userId) => {
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/dsa/stats`, {
                headers: { ...headers(), 'x-user-id': uid },
            });
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
                setLastSyncedLabel(formatSynced(json.data?.lastSynced));
            } else {
                setError(json.message || 'Failed to load stats.');
            }
        } catch (e) {
            setError('Cannot reach the server. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // ── Sync via POST /api/dsa/sync ─────────────────────────────────────
    const handleSync = async () => {
        if (!userId) {
            setSyncMessage('⚠️ No user ID set. See the setup guide below.');
            return;
        }
        setSyncing(true);
        setSyncMessage('');
        try {
            const res = await fetch(`${API_BASE}/dsa/sync`, {
                method: 'POST',
                headers: { ...headers(), 'x-user-id': userId },
            });
            const json = await res.json();
            if (json.success) {
                setSyncData(json.data);
                setStats((prev) => ({
                    ...prev,
                    totalSolved: json.data.totalSolved,
                    easy: json.data.easy,
                    medium: json.data.medium,
                    hard: json.data.hard,
                    ranking: json.data.ranking,
                    lastSynced: json.data.lastSynced,
                }));
                setLastSyncedLabel(formatSynced(json.data?.lastSynced));
                setSyncMessage(json.fromCache ? '✓ Showing cached data (synced within 24h)' : '✅ Synced successfully with LeetCode!');
            } else {
                setSyncMessage(`❌ ${json.message}`);
            }
        } catch (e) {
            setSyncMessage('❌ Failed to reach backend. Is the server running?');
        } finally {
            setSyncing(false);
        }
    };

    // ── Initial load ────────────────────────────────────────────────────
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // ─────────────────────────────────────────────────────────────────────
    // Computed display values (safe defaults)
    // ─────────────────────────────────────────────────────────────────────
    const totalSolved = stats?.totalSolved ?? 0;
    const easy = stats?.easy ?? 0;
    const medium = stats?.medium ?? 0;
    const hard = stats?.hard ?? 0;
    const ranking = stats?.ranking ?? null;
    const streak = stats?.streak ?? 0;
    const solvedToday = stats?.problemsSolvedToday ?? 0;
    const neverSynced = stats?.neverSynced ?? true;
    const recentSubs = syncData?.recentSubmissions ?? [];

    // Total LeetCode problems approximation (for ring progress)
    const TOTAL_EASY = 850;
    const TOTAL_MEDIUM = 1800;
    const TOTAL_HARD = 800;
    const TOTAL_ALL = TOTAL_EASY + TOTAL_MEDIUM + TOTAL_HARD;

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="page-content">
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
                @keyframes slide-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .dsa-sync-btn {
                    padding: 8px 20px;
                    background: linear-gradient(135deg, var(--accent), var(--purple));
                    border: none;
                    border-radius: 20px;
                    color: white;
                    font-size: 0.78rem;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: inherit;
                    letter-spacing: 0.03em;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .dsa-sync-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 0 20px rgba(99,102,241,0.4);
                }
                .dsa-sync-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .lc-submission-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 11px 16px;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s;
                    animation: slide-in 0.3s ease forwards;
                }
                .lc-submission-row:last-child { border-bottom: none; }
                .lc-submission-row:hover { background: var(--bg-card-hover); }
                .lc-stat-ring {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 32px;
                    padding: 24px;
                    flex-wrap: wrap;
                }
                .setup-box {
                    background: rgba(99,102,241,0.08);
                    border: 1px solid rgba(99,102,241,0.25);
                    border-radius: 12px;
                    padding: 20px 24px;
                    margin-bottom: 24px;
                    animation: slide-in 0.4s ease;
                }
                .sync-msg {
                    font-size: 0.78rem;
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.05);
                    display: inline-block;
                    animation: slide-in 0.3s ease;
                }
            `}</style>

            {/* ── Header row ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Last synced: <span style={{ color: 'var(--text-secondary)' }}>{loading ? '...' : lastSyncedLabel || 'Never'}</span>
                    </div>
                    {streak > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <PulseDot color="var(--warning)" />
                            <span style={{ fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 600 }}>{streak}-day LeetCode streak 🔥</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {syncMessage && <span className="sync-msg">{syncMessage}</span>}
                    <button
                        className="dsa-sync-btn"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? (
                            <>
                                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                Syncing…
                            </>
                        ) : '⚡ Sync LeetCode'}
                    </button>
                </div>
            </div>

            {/* ── Setup notice if no user ID ─────────────────────────────── */}
            {!userId && (
                <div className="setup-box">
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: 8 }}>🔧 Dev Setup Required</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        To test the DSA tracker, set your User ID in the browser console:<br />
                        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem' }}>
                            localStorage.setItem('jarvis_user_id', '&lt;your_mongodb_user_id&gt;')
                        </code>
                        <br />then reload the page. Also make sure your User document has a <code style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 6px', borderRadius: 4 }}>leetcode_username</code> field set.
                    </div>
                </div>
            )}

            {/* ── Stats grid ────────────────────────────────────────────── */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {/* Total Solved */}
                <div className="stat-card success">
                    <div className="stat-header">
                        <div className="stat-icon-wrap success">✅</div>
                        {solvedToday > 0 && <span className="stat-change up">+{solvedToday} today</span>}
                    </div>
                    {loading ? <Skeleton height={32} width={80} style={{ marginBottom: 8 }} /> : <div className="stat-value">{totalSolved}</div>}
                    <div className="stat-label">Total Solved</div>
                </div>

                {/* Streak */}
                <div className="stat-card accent">
                    <div className="stat-header">
                        <div className="stat-icon-wrap accent">🔥</div>
                    </div>
                    {loading ? <Skeleton height={32} width={60} style={{ marginBottom: 8 }} /> : <div className="stat-value">{streak}</div>}
                    <div className="stat-label">Day Streak</div>
                </div>

                {/* Hard Solved */}
                <div className="stat-card danger">
                    <div className="stat-header">
                        <div className="stat-icon-wrap danger">💀</div>
                    </div>
                    {loading ? <Skeleton height={32} width={60} style={{ marginBottom: 8 }} /> : <div className="stat-value">{hard}</div>}
                    <div className="stat-label">Hard Solved</div>
                </div>

                {/* Ranking */}
                <div className="stat-card warning">
                    <div className="stat-header">
                        <div className="stat-icon-wrap warning">🏆</div>
                    </div>
                    {loading
                        ? <Skeleton height={32} width={90} style={{ marginBottom: 8 }} />
                        : <div className="stat-value" style={{ fontSize: ranking && ranking > 999999 ? '1.2rem' : undefined }}>
                            {ranking ? `#${ranking.toLocaleString()}` : '—'}
                        </div>
                    }
                    <div className="stat-label">Global Rank</div>
                </div>
            </div>

            {/* ── Content grid ──────────────────────────────────────────── */}
            <div className="content-grid">

                {/* ── Left: Ring chart + recent submissions ────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Difficulty rings */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">📊 Solved Breakdown</span>
                            {neverSynced && !loading && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sync to load data</span>
                            )}
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <div className="lc-stat-ring">
                                {loading ? (
                                    <>
                                        <Skeleton width={80} height={80} radius="50%" />
                                        <Skeleton width={80} height={80} radius="50%" />
                                        <Skeleton width={80} height={80} radius="50%" />
                                        <Skeleton width={80} height={80} radius="50%" />
                                    </>
                                ) : (
                                    <>
                                        <RingProgress value={totalSolved} max={TOTAL_ALL} color="var(--accent)" size={90} label={String(totalSolved)} subLabel="All" />
                                        <RingProgress value={easy} max={TOTAL_EASY} color="var(--success)" size={80} label={String(easy)} subLabel="Easy" />
                                        <RingProgress value={medium} max={TOTAL_MEDIUM} color="var(--warning)" size={80} label={String(medium)} subLabel="Medium" />
                                        <RingProgress value={hard} max={TOTAL_HARD} color="var(--danger)" size={80} label={String(hard)} subLabel="Hard" />
                                    </>
                                )}
                            </div>

                            {/* Difficulty bars */}
                            {!loading && (
                                <div style={{ padding: '0 24px 24px' }}>
                                    {[
                                        { label: 'Easy', solved: easy, total: TOTAL_EASY, color: 'var(--success)' },
                                        { label: 'Medium', solved: medium, total: TOTAL_MEDIUM, color: 'var(--warning)' },
                                        { label: 'Hard', solved: hard, total: TOTAL_HARD, color: 'var(--danger)' },
                                    ].map((d) => (
                                        <div key={d.label} style={{ marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.solved} / {d.total}</span>
                                            </div>
                                            <div className="progress-bar" style={{ width: '100%' }}>
                                                <div className="progress-fill" style={{
                                                    width: `${d.total > 0 ? Math.min((d.solved / d.total) * 100, 100) : 0}%`,
                                                    background: d.color,
                                                    transition: 'width 0.8s ease',
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Submissions (populated after sync) */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">📋 Recent Submissions</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {recentSubs.length > 0 ? `${recentSubs.length} shown` : 'Sync to load'}
                            </span>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {loading ? (
                                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {[...Array(4)].map((_, i) => <Skeleton key={i} height={20} />)}
                                </div>
                            ) : recentSubs.length === 0 ? (
                                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔄</div>
                                    Click <strong style={{ color: 'var(--accent-light)' }}>⚡ Sync LeetCode</strong> to load recent submissions
                                </div>
                            ) : (
                                recentSubs.map((s, i) => (
                                    <div key={i} className="lc-submission-row">
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {s.title}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                            </div>
                                        </div>
                                        <span className={`badge ${s.status === 'Accepted' ? 'done' : s.status === 'Wrong Answer' ? 'danger' : 'pending'}`}
                                            style={{ whiteSpace: 'nowrap', fontSize: '0.62rem' }}>
                                            {s.status || 'Unknown'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right: Quick stats + error ───────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Quick overview */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">⚡ Quick Overview</span>
                        </div>
                        <div className="card-body">
                            {[
                                { label: 'Today Solved', value: loading ? '…' : String(solvedToday), color: solvedToday > 0 ? 'var(--success)' : 'var(--text-muted)' },
                                { label: 'Streak', value: loading ? '…' : `${streak} days`, color: streak > 0 ? 'var(--warning)' : 'var(--text-muted)' },
                                { label: 'Easy Solved', value: loading ? '…' : String(easy), color: 'var(--success)' },
                                { label: 'Medium Solved', value: loading ? '…' : String(medium), color: 'var(--warning)' },
                                { label: 'Hard Solved', value: loading ? '…' : String(hard), color: 'var(--danger)' },
                                { label: 'Global Rank', value: loading ? '…' : ranking ? `#${ranking.toLocaleString()}` : '—', color: 'var(--accent-light)' },
                            ].map((row) => (
                                <div key={row.label} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 0', borderBottom: '1px solid var(--border)',
                                }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: row.color, fontFamily: 'Space Grotesk' }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error state */}
                    {error && (
                        <div style={{
                            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
                            borderRadius: 12, padding: '16px 20px', animation: 'slide-in 0.3s ease',
                        }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>⚠️ Error</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{error}</div>
                        </div>
                    )}

                    {/* How-to card */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">ℹ️ How It Works</span>
                        </div>
                        <div className="card-body">
                            {[
                                { icon: '1️⃣', text: 'Your LeetCode username must be set on your User profile in the DB.' },
                                { icon: '2️⃣', text: 'Click "⚡ Sync LeetCode" to fetch fresh stats from LeetCode.' },
                                { icon: '3️⃣', text: 'Stats are cached for 24 hours — no repeated API calls on refresh.' },
                                { icon: '4️⃣', text: 'Submissions are stored permanently and deduplicated automatically.' },
                                { icon: '🔥', text: 'Streak counts consecutive days with at least one Accepted solution.' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 4 ? 12 : 0, alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{item.icon}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
