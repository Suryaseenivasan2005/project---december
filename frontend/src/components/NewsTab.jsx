import React from 'react';

const card = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
};

// Formatter copied from Portfolio.jsx or inline
function timeAgo(dateString) {
    const passed = new Date() - new Date(dateString);
    const msPerMinute = 60 * 1000, msPerHour = msPerMinute * 60, msPerDay = msPerHour * 24;
    if (passed < msPerMinute) return 'JUST NOW';
    else if (passed < msPerHour) return Math.round(passed / msPerMinute) + 'm ago';
    else if (passed < msPerDay) return Math.round(passed / msPerHour) + 'h ago';
    else return Math.round(passed / msPerDay) + 'd ago';
}

export default function NewsTab({ news, loading, error }) {
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
            <div style={{
                width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1',
                borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>Fetching latest news…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#f43f5e', fontSize: '0.88rem' }}>
            ⚠️ {error}
        </div>
    );

    if (!news || !news.length) return (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.25)', fontSize: '1rem' }}>
            No news available. Click Refresh to load.
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {news.map((item, i) => (
                <a
                    key={item.link || i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                >
                    <div style={{
                        ...card,
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                        height: '100%',
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8',
                                }}>{item.relatedSymbol}</span>
                                <span style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.3)' }}>{timeAgo(item.publishedAt)}</span>
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0f2ff', lineHeight: 1.45, flex: 1 }}>
                                {item.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{item.publisher}</div>
                            <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, marginTop: 4 }}>Read More →</div>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
