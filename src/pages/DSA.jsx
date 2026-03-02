const problems = [
    { name: 'Two Sum', topic: 'Arrays', difficulty: 'easy', status: 'done', platform: 'LeetCode', date: 'Today' },
    { name: 'Merge Intervals', topic: 'Arrays', difficulty: 'medium', status: 'pending', platform: 'LeetCode', date: 'Today' },
    { name: 'LRU Cache', topic: 'Design', difficulty: 'medium', status: 'pending', platform: 'LeetCode', date: 'Today' },
    { name: 'Word Ladder', topic: 'BFS/Graphs', difficulty: 'hard', status: 'pending', platform: 'LeetCode', date: 'Today' },
    { name: 'Valid Parentheses', topic: 'Stack', difficulty: 'easy', status: 'done', platform: 'LeetCode', date: 'Yesterday' },
    { name: 'Binary Tree Path Sum', topic: 'Trees', difficulty: 'medium', status: 'done', platform: 'LeetCode', date: 'Yesterday' },
];

export default function DSA() {
    return (
        <div className="page-content">
            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card success">
                    <div className="stat-header">
                        <div className="stat-icon-wrap success">✅</div>
                        <span className="stat-change up">+5 today</span>
                    </div>
                    <div className="stat-value">147</div>
                    <div className="stat-label">Total Solved</div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-header">
                        <div className="stat-icon-wrap accent">🔥</div>
                    </div>
                    <div className="stat-value">12</div>
                    <div className="stat-label">Day Streak</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-header">
                        <div className="stat-icon-wrap warning">⏳</div>
                    </div>
                    <div className="stat-value">3</div>
                    <div className="stat-label">Pending Today</div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-header">
                        <div className="stat-icon-wrap danger">💀</div>
                    </div>
                    <div className="stat-value">18</div>
                    <div className="stat-label">Hard Solved</div>
                </div>
            </div>

            <div className="content-grid">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">🧩 Problem List</span>
                        <button style={{ padding: '5px 14px', background: 'linear-gradient(135deg, var(--accent), var(--purple))', border: 'none', borderRadius: 20, color: 'white', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            + Add Problem
                        </button>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    {['Problem', 'Topic', 'Difficulty', 'Platform', 'Date', 'Status'].map((h) => (
                                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {problems.map((p) => (
                                    <tr key={p.name} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.topic}</td>
                                        <td style={{ padding: '12px 16px' }}><span className={`badge ${p.difficulty}`}>{p.difficulty}</span></td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.platform}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.date}</td>
                                        <td style={{ padding: '12px 16px' }}><span className={`badge ${p.status}`}>{p.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Topics breakdown */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">📊 By Topic</span>
                    </div>
                    <div className="card-body">
                        {[
                            { topic: 'Arrays', solved: 42, total: 60, color: 'var(--accent)' },
                            { topic: 'Trees', solved: 28, total: 45, color: 'var(--success)' },
                            { topic: 'Graphs', solved: 15, total: 38, color: 'var(--purple)' },
                            { topic: 'DP', solved: 20, total: 50, color: 'var(--warning)' },
                            { topic: 'Stack/Queue', solved: 18, total: 25, color: 'var(--cyan)' },
                            { topic: 'Design', solved: 12, total: 20, color: 'var(--danger)' },
                        ].map((t) => (
                            <div key={t.topic} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.topic}</span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.solved}/{t.total}</span>
                                </div>
                                <div className="progress-bar" style={{ width: '100%' }}>
                                    <div className="progress-fill" style={{ width: `${(t.solved / t.total) * 100}%`, background: t.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
