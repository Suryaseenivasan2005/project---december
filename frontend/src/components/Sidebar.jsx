const navSections = [
  {
    title: 'Core',
    items: [
      { id: 'dashboard', icon: '⚡', label: 'Dashboard', badge: null },
      { id: 'projects', icon: '🚀', label: 'Projects', badge: '4' },
      { id: 'dsa', icon: '🧩', label: 'DSA Tracker', badge: '3' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'documents', icon: '🗄️', label: 'Document Vault', badge: null },
      { id: 'mail', icon: '📨', label: 'Mail & LinkedIn', badge: '7' },
      { id: 'clients', icon: '🤝', label: 'Clients & Internships', badge: null },
    ],
  },
  {
    title: 'Personal',
    items: [
      { id: 'reading', icon: '📚', label: 'Reading Tracker', badge: null },
      { id: 'portfolio', icon: '📈', label: 'Portfolio', badge: null },
    ],
  },
  {
    title: 'AI',
    items: [
      { id: 'assistant', icon: '🤖', label: 'AI Assistant', badge: null },
      { id: 'automation', icon: '⚙️', label: 'Automation', badge: null },
    ],
  },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <div>
          <div className="logo-text">
            Jarvis
            <span className="logo-sub">AI Productivity OS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">JS</div>
          <div>
            <div className="user-name">Jarvis System</div>
            <div className="user-status">Online</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
