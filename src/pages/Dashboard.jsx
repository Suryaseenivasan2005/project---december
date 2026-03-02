import { useState } from 'react';

const recentProjects = [
    { name: 'Jarvis Dashboard', stack: 'React + Node.js', progress: 35, color: '#6366f1', status: 'active', updated: '2h ago' },
    { name: 'E-Commerce API', stack: 'Express + MongoDB', progress: 78, color: '#22d3a5', status: 'active', updated: '1d ago' },
    { name: 'Portfolio v3', stack: 'Next.js + Tailwind', progress: 90, color: '#a855f7', status: 'active', updated: '3d ago' },
    { name: 'Chat App (Talklet)', stack: 'React + Socket.io', progress: 95, color: '#06b6d4', status: 'done', updated: '1w ago' },
];

const dsaTasks = [
    { name: 'Two Sum', difficulty: 'easy', done: true },
    { name: 'Merge Intervals', difficulty: 'medium', done: false },
    { name: 'LRU Cache', difficulty: 'medium', done: false },
    { name: 'Word Ladder', difficulty: 'hard', done: false },
];

const activityFeed = [
    { dot: 'accent', text: 'Committed to Jarvis Dashboard: Added sidebar navigation', time: '2h ago' },
    { dot: 'success', text: 'Solved "Two Sum" on LeetCode (Easy)', time: '4h ago' },
    { dot: 'purple', text: 'New LinkedIn message from Recruiter @ Google', time: '5h ago' },
    { dot: 'warning', text: 'Reminder: Follow up with client "TechCorp" due tomorrow', time: '6h ago' },
    { dot: 'accent', text: 'Finished chapter 4 of "Clean Code"', time: 'Yesterday' },
];

const aiSuggestions = [
    'You have 3 pending DSA problems. Want me to suggest an easy warm-up?',
    'LeetCode solving streak: 12 days 🔥 Keep going!',
];

export default function Dashboard() {
    const [aiInput, setAiInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { type: 'bot', text: aiSuggestions[0] },
    ]);
    const [typing, setTyping] = useState(false);

    const handleSend = () => {
        if (!aiInput.trim()) return;
        const userMsg = aiInput.trim();
        setChatMessages((prev) => [...prev, { type: 'user', text: userMsg }]);
        setAiInput('');
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            setChatMessages((prev) => [
                ...prev,
                { type: 'bot', text: 'I\'m still being trained! Full AI integration coming soon. 🚀' },
            ]);
        }, 1400);
    };

    return (
        <div className="page-content">
            {/* Streak + Quick Pulse */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                        Monday, March 2, 2026
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span className="streak-badge">🔥 12-day DSA Streak</span>
                        <span className="streak-badge" style={{ color: 'var(--accent-light)', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)' }}>⚡ 4 Active Projects</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Productivity Score</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>84%</div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                <div className="stat-card accent">
                    <div className="stat-header">
                        <div className="stat-icon-wrap accent">🚀</div>
                        <span className="stat-change up">↑ 1</span>
                    </div>
                    <div className="stat-value">4</div>
                    <div className="stat-label">Active Projects</div>
                    <div className="stat-bar">
                        <div className="stat-bar-fill" style={{ width: '70%', background: 'linear-gradient(90deg, var(--accent), var(--purple))' }}></div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-header">
                        <div className="stat-icon-wrap success">🧩</div>
                        <span className="stat-change up">+5 today</span>
                    </div>
                    <div className="stat-value">147</div>
                    <div className="stat-label">Problems Solved</div>
                    <div className="stat-bar">
                        <div className="stat-bar-fill" style={{ width: '55%', background: 'linear-gradient(90deg, var(--success), var(--cyan))' }}></div>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-header">
                        <div className="stat-icon-wrap warning">📨</div>
                        <span className="stat-change down">7 new</span>
                    </div>
                    <div className="stat-value">7</div>
                    <div className="stat-label">Unread Messages</div>
                    <div className="stat-bar">
                        <div className="stat-bar-fill" style={{ width: '30%', background: 'linear-gradient(90deg, var(--warning), #f97316)' }}></div>
                    </div>
                </div>

                <div className="stat-card danger">
                    <div className="stat-header">
                        <div className="stat-icon-wrap purple">🤝</div>
                        <span className="stat-change up">+2</span>
                    </div>
                    <div className="stat-value">3</div>
                    <div className="stat-label">Pending Applications</div>
                    <div className="stat-bar">
                        <div className="stat-bar-fill" style={{ width: '40%', background: 'linear-gradient(90deg, var(--danger), var(--purple))' }}></div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Active Projects */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">🚀 Active Projects</span>
                            <span className="card-action">View All →</span>
                        </div>
                        <div className="card-body">
                            {recentProjects.map((p) => (
                                <div className="project-item" key={p.name}>
                                    <div className="project-color" style={{ background: p.color }}></div>
                                    <div className="project-info">
                                        <div className="project-name">{p.name}</div>
                                        <div className="project-meta">
                                            <span>{p.stack}</span>
                                            <span>·</span>
                                            <span>{p.updated}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        <span className={`badge ${p.status}`}>{p.status}</span>
                                        <div className="project-progress">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${p.progress}%` }}></div>
                                            </div>
                                            <span className="progress-pct">{p.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DSA Today */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">🧩 DSA — Today's Queue</span>
                            <span className="card-action">Full Tracker →</span>
                        </div>
                        <div className="card-body">
                            <div className="quick-stats" style={{ marginBottom: 16 }}>
                                <div className="quick-stat">
                                    <div className="quick-stat-val" style={{ color: 'var(--success)' }}>1</div>
                                    <div className="quick-stat-lbl">Solved</div>
                                </div>
                                <div className="quick-stat">
                                    <div className="quick-stat-val" style={{ color: 'var(--warning)' }}>3</div>
                                    <div className="quick-stat-lbl">Pending</div>
                                </div>
                                <div className="quick-stat">
                                    <div className="quick-stat-val" style={{ color: 'var(--accent-light)' }}>🔥12</div>
                                    <div className="quick-stat-lbl">Streak</div>
                                </div>
                            </div>
                            {dsaTasks.map((t) => (
                                <div className="dsa-item" key={t.name}>
                                    <div className={`dsa-checkbox ${t.done ? 'checked' : ''}`}>
                                        {t.done && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                                    </div>
                                    <span className={`dsa-name ${t.done ? 'done' : ''}`}>{t.name}</span>
                                    <span className={`badge ${t.difficulty}`}>{t.difficulty}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* AI Assistant Panel */}
                    <div className="ai-panel">
                        <div className="ai-header">
                            <div className="ai-icon glowing">🤖</div>
                            <div>
                                <div className="ai-title">Jarvis AI</div>
                                <div className="ai-status">● Active</div>
                            </div>
                        </div>
                        <div className="ai-chat-area">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`ai-bubble ${msg.type}`}>{msg.text}</div>
                            ))}
                            {typing && (
                                <div className="ai-bubble bot">
                                    <span className="typing-dot"></span>{' '}
                                    <span className="typing-dot"></span>{' '}
                                    <span className="typing-dot"></span>
                                </div>
                            )}
                        </div>
                        <div className="ai-input-row">
                            <input
                                className="ai-input"
                                type="text"
                                placeholder="Ask Jarvis anything..."
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button className="send-btn" onClick={handleSend}>➤</button>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">📋 Recent Activity</span>
                            <span className="card-action">All →</span>
                        </div>
                        <div className="card-body">
                            {activityFeed.map((a, i) => (
                                <div className="activity-item" key={i}>
                                    <div className={`activity-dot ${a.dot}`}></div>
                                    <div>
                                        <div className="activity-text">{a.text}</div>
                                        <div className="activity-time">{a.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="three-col-grid">
                {/* Reading */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">📚 Reading</span>
                        <span className="card-action">View →</span>
                    </div>
                    <div className="card-body">
                        {[
                            { title: 'Clean Code', author: 'Robert Martin', status: 'reading', progress: 65 },
                            { title: 'System Design', author: 'Alex Xu', status: 'reading', progress: 30 },
                            { title: 'DDIA', author: 'Martin Kleppmann', status: 'pending', progress: 0 },
                        ].map((b) => (
                            <div key={b.title} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{b.title}</span>
                                    <span className={`badge ${b.status}`}>{b.status}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>{b.author}</div>
                                {b.progress > 0 && (
                                    <div className="progress-bar" style={{ width: '100%' }}>
                                        <div className="progress-fill" style={{ width: `${b.progress}%` }}></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mail Snapshot */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">📨 Mail & LinkedIn</span>
                        <span className="card-action">Open →</span>
                    </div>
                    <div className="card-body">
                        {[
                            { from: 'Google Recruiter', subject: 'SWE Internship Opportunity', type: 'new', via: 'LinkedIn' },
                            { from: 'Priya Sharma', subject: 'Project collaboration?', type: 'new', via: 'Email' },
                            { from: 'HackerRank', subject: 'You rank top 5%!', type: 'done', via: 'Email' },
                        ].map((m) => (
                            <div key={m.from} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.from}</span>
                                    <span className={`badge ${m.type}`}>{m.via}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.subject}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Portfolio Snapshot */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">📈 Portfolio</span>
                        <span className="card-action">Details →</span>
                    </div>
                    <div className="card-body">
                        <div className="quick-stats" style={{ marginBottom: 14 }}>
                            <div className="quick-stat">
                                <div className="quick-stat-val" style={{ color: 'var(--success)' }}>₹24K</div>
                                <div className="quick-stat-lbl">Total Value</div>
                            </div>
                            <div className="quick-stat">
                                <div className="quick-stat-val" style={{ color: 'var(--success)' }}>+8.4%</div>
                                <div className="quick-stat-lbl">Returns</div>
                            </div>
                        </div>
                        {[
                            { name: 'NIFTY ETF', change: '+2.1%', up: true },
                            { name: 'TCS', change: '-0.8%', up: false },
                            { name: 'SBI Mutual', change: '+1.3%', up: true },
                        ].map((s) => (
                            <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.up ? 'var(--success)' : 'var(--danger)' }}>{s.change}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
