const pageTitles = {
    dashboard: { title: 'Dashboard', subtitle: 'Good evening! Here\'s your productivity overview.' },
    projects: { title: 'Projects', subtitle: 'Track and manage your active projects.' },
    dsa: { title: 'DSA Tracker', subtitle: 'Monitor your daily problem-solving practice.' },
    documents: { title: 'Document Vault', subtitle: 'All your important files in one place.' },
    mail: { title: 'Mail & LinkedIn', subtitle: 'Manage communications and AI-drafted replies.' },
    clients: { title: 'Clients & Internships', subtitle: 'Track applications and client relationships.' },
    reading: { title: 'Reading Tracker', subtitle: 'Your personal library and reading progress.' },
    portfolio: { title: 'Portfolio', subtitle: 'Track your investments and financial snapshot.' },
    assistant: { title: 'AI Assistant', subtitle: 'Your personal AI-powered productivity partner.' },
    automation: { title: 'Automation Engine', subtitle: 'Scheduled workflows and smart triggers.' },
};

export default function Topbar({ activePage }) {
    const { title, subtitle } = pageTitles[activePage] || pageTitles.dashboard;

    return (
        <header className="topbar">
            <div style={{ flex: 1 }}>
                <div className="topbar-title">
                    {title}
                    <span className="topbar-subtitle">{subtitle}</span>
                </div>
            </div>

            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search anything..." />
            </div>

            <div className="topbar-actions">
                <div className="icon-btn" title="Notifications">
                    🔔
                    <span className="notif-dot"></span>
                </div>
                <div className="icon-btn" title="Settings">⚙️</div>
                <div className="icon-btn" title="Theme">🌙</div>
            </div>
        </header>
    );
}
