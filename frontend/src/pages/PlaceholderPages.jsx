function PlaceholderPage({ icon, title, description, features }) {
    return (
        <div className="page-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                {features.map((f) => (
                    <div className="stat-card accent" key={f.label} style={{ cursor: 'default' }}>
                        <div className="stat-header">
                            <div className="stat-icon-wrap accent">{f.icon}</div>
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                    </div>
                ))}
            </div>
            <div className="placeholder-page">
                <div className="placeholder-icon">{icon}</div>
                <div className="placeholder-title">{title}</div>
                <div className="placeholder-desc">{description}</div>
                <button className="coming-soon-btn">🚧 Coming Soon — In Development</button>
            </div>
        </div>
    );
}

export function DocumentsPage() {
    return (
        <PlaceholderPage
            icon="🗄️"
            title="Document Vault"
            description="Securely store, organize, and share all your important files. Upload documents, certificates, and media in one encrypted vault."
            features={[
                { icon: '📁', label: 'File Upload', desc: 'Drag & drop any file type' },
                { icon: '🔒', label: 'Secure Storage', desc: 'Encrypted at rest' },
                { icon: '📤', label: 'Quick Share', desc: 'Email or copy link' },
                { icon: '🗂️', label: 'Smart Organize', desc: 'Auto-categorize files' },
            ]}
        />
    );
}

export function MailPage() {
    return (
        <PlaceholderPage
            icon="📨"
            title="Mail & LinkedIn Automation"
            description="Fetch incoming messages, auto-categorize them, and generate AI-powered reply drafts so you never miss an important message."
            features={[
                { icon: '📥', label: 'Inbox Sync', desc: 'Gmail + LinkedIn' },
                { icon: '🤖', label: 'AI Drafts', desc: 'Smart reply generation' },
                { icon: '🏷️', label: 'Auto-Tag', desc: 'Priority categorization' },
                { icon: '⏰', label: 'Follow-ups', desc: 'Smart reminders' },
            ]}
        />
    );
}

export function ClientsPage() {
    return (
        <PlaceholderPage
            icon="🤝"
            title="Clients & Internships"
            description="Track job applications, internship statuses, client details, and all your professional communications in one place."
            features={[
                { icon: '📋', label: 'Applications', desc: 'Track every stage' },
                { icon: '💬', label: 'Comms Log', desc: 'Communication history' },
                { icon: '📊', label: 'Status Board', desc: 'Kanban-style tracking' },
                { icon: '🔔', label: 'Reminders', desc: 'Follow-up alerts' },
            ]}
        />
    );
}

export function ReadingPage() {
    return (
        <PlaceholderPage
            icon="📚"
            title="Reading Tracker"
            description="Maintain your personal library, track reading progress, and capture key notes and insights from every book you read."
            features={[
                { icon: '📖', label: 'Book Library', desc: 'All books in one place' },
                { icon: '📝', label: 'Notes', desc: 'Capture key insights' },
                { icon: '📈', label: 'Progress', desc: 'Chapter-level tracking' },
                { icon: '⭐', label: 'Reviews', desc: 'Rate & recommend' },
            ]}
        />
    );
}

export function PortfolioPage() {
    return (
        <PlaceholderPage
            icon="📈"
            title="Portfolio Tracker"
            description="Monitor your investments, view real-time P&L, track portfolio allocation, and get AI-powered financial insights."
            features={[
                { icon: '💰', label: 'Holdings', desc: 'Stocks & mutual funds' },
                { icon: '📉', label: 'P&L Tracker', desc: 'Real-time profit/loss' },
                { icon: '🥧', label: 'Allocation', desc: 'Portfolio breakdown' },
                { icon: '🤖', label: 'AI Insights', desc: 'Smart suggestions' },
            ]}
        />
    );
}

export function AssistantPage() {
    return (
        <PlaceholderPage
            icon="🤖"
            title="AI Assistant"
            description="Ask Jarvis anything about your productivity data. Get smart suggestions, analyze patterns, and automate decisions."
            features={[
                { icon: '💬', label: 'NL Queries', desc: 'Ask in plain English' },
                { icon: '🧠', label: 'Insights', desc: 'Pattern analysis' },
                { icon: '⏰', label: 'Reminders', desc: 'AI-scheduled alerts' },
                { icon: '🔮', label: 'Predictions', desc: 'Productivity forecasts' },
            ]}
        />
    );
}

export function AutomationPage() {
    return (
        <PlaceholderPage
            icon="⚙️"
            title="Automation Engine"
            description="Build powerful workflows with scheduled triggers, data sync pipelines, and smart notification systems — all no-code."
            features={[
                { icon: '⏱️', label: 'Schedulers', desc: 'Time-based triggers' },
                { icon: '🔗', label: 'Workflows', desc: 'Multi-step chains' },
                { icon: '🔔', label: 'Notifications', desc: 'Smart alerts' },
                { icon: '🔄', label: 'Data Sync', desc: 'Cross-module sync' },
            ]}
        />
    );
}
