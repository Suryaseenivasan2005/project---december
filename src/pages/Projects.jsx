const projects = [
    { name: 'Jarvis Dashboard', stack: 'React + Node.js', progress: 35, color: '#6366f1', status: 'active', github: '#', live: '#', updated: '2h ago', desc: 'AI-powered personal productivity OS.' },
    { name: 'E-Commerce API', stack: 'Express + MongoDB', progress: 78, color: '#22d3a5', status: 'active', github: '#', live: null, updated: '1d ago', desc: 'RESTful backend for a shopping platform.' },
    { name: 'Portfolio v3', stack: 'Next.js + Tailwind', progress: 90, color: '#a855f7', status: 'active', github: '#', live: '#', updated: '3d ago', desc: 'Personal developer portfolio redesign.' },
    { name: 'Chat App (Talklet)', stack: 'React + Socket.io', progress: 95, color: '#06b6d4', status: 'done', github: '#', live: '#', updated: '1w ago', desc: 'Real-time messaging app with bot support.' },
];

export default function Projects() {
    return (
        <div className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="quick-stats" style={{ flex: 1, maxWidth: 400 }}>
                    <div className="quick-stat">
                        <div className="quick-stat-val" style={{ color: 'var(--accent-light)' }}>4</div>
                        <div className="quick-stat-lbl">Total</div>
                    </div>
                    <div className="quick-stat">
                        <div className="quick-stat-val" style={{ color: 'var(--success)' }}>3</div>
                        <div className="quick-stat-lbl">Active</div>
                    </div>
                    <div className="quick-stat">
                        <div className="quick-stat-val" style={{ color: 'var(--text-muted)' }}>1</div>
                        <div className="quick-stat-lbl">Done</div>
                    </div>
                </div>
                <button style={{ padding: '9px 20px', background: 'linear-gradient(135deg, var(--accent), var(--purple))', border: 'none', borderRadius: 24, color: 'white', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + New Project
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {projects.map((p) => (
                    <div className="card" key={p.name} style={{ cursor: 'pointer' }}>
                        <div style={{ height: 4, background: p.color, borderRadius: '14px 14px 0 0' }}></div>
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div>
                                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{p.name}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.stack}</div>
                                </div>
                                <span className={`badge ${p.status}`}>{p.status}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>{p.desc}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Progress</span>
                                <div className="progress-bar" style={{ flex: 1 }}>
                                    <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }}></div>
                                </div>
                                <span className="progress-pct">{p.progress}%</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {p.github && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-light)', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        ⎇ GitHub
                                    </span>
                                )}
                                {p.live && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--success)', background: 'var(--success-bg)', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: '1px solid rgba(34,211,165,0.2)' }}>
                                        ↗ Live
                                    </span>
                                )}
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Updated {p.updated}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
