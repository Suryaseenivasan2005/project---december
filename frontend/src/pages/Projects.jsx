import { useState, useEffect } from 'react';

// ─── API helpers ─────────────────────────────────────
const API = '/api/projects';

const fetchProjects = () => fetch(API).then((r) => r.json());
const createProject = (data) =>
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json());
const updateProject = (id, data) =>
    fetch(`${API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json());
const deleteProject = (id) =>
    fetch(`${API}/${id}`, { method: 'DELETE' }).then((r) => r.json());

// ─── Color palette ───────────────────────────────────
const COLORS = ['#6366f1', '#22d3a5', '#a855f7', '#06b6d4', '#f59e0b', '#f43f5e', '#3b82f6', '#ec4899'];

const STATUS_OPTIONS = ['active', 'planning', 'paused', 'done'];

const EMPTY_FORM = {
    name: '',
    description: '',
    githubLink: '',
    liveLink: '',
    techStack: '',
    progress: 0,
    status: 'active',
    color: '#6366f1',
};

// ─── Project Form Modal ───────────────────────────────
function ProjectModal({ mode, initial, onClose, onSave }) {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Project name is required';
        if (form.githubLink && !form.githubLink.startsWith('http'))
            e.githubLink = 'Must be a valid URL (start with http)';
        if (form.liveLink && !form.liveLink.startsWith('http'))
            e.liveLink = 'Must be a valid URL (start with http)';
        return e;
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    // Close on backdrop click
    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div className="modal-backdrop" onClick={handleBackdrop}>
            <div className="modal">
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">
                            {mode === 'create' ? '🚀 New Project' : '✏️ Edit Project'}
                        </h2>
                        <p className="modal-subtitle">
                            {mode === 'create' ? 'Fill in the details to add a new project' : 'Update your project details'}
                        </p>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Color picker as accent line */}
                    <div className="modal-color-bar" style={{ background: `linear-gradient(90deg, ${form.color}, transparent)` }}></div>

                    <div className="form-grid">
                        {/* Project Name */}
                        <div className="form-group full">
                            <label className="form-label">Project Name <span className="required">*</span></label>
                            <input
                                className={`form-input ${errors.name ? 'input-error' : ''}`}
                                type="text"
                                placeholder="e.g. Jarvis Dashboard"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                            {errors.name && <span className="input-err-msg">{errors.name}</span>}
                        </div>

                        {/* GitHub Link */}
                        <div className="form-group">
                            <label className="form-label">⎇ GitHub Repository</label>
                            <input
                                className={`form-input ${errors.githubLink ? 'input-error' : ''}`}
                                type="url"
                                placeholder="https://github.com/username/repo"
                                value={form.githubLink}
                                onChange={(e) => handleChange('githubLink', e.target.value)}
                            />
                            {errors.githubLink && <span className="input-err-msg">{errors.githubLink}</span>}
                        </div>

                        {/* Live Link */}
                        <div className="form-group">
                            <label className="form-label">↗ Live URL</label>
                            <input
                                className={`form-input ${errors.liveLink ? 'input-error' : ''}`}
                                type="url"
                                placeholder="https://your-app.vercel.app"
                                value={form.liveLink}
                                onChange={(e) => handleChange('liveLink', e.target.value)}
                            />
                            {errors.liveLink && <span className="input-err-msg">{errors.liveLink}</span>}
                        </div>

                        {/* Tech Stack */}
                        <div className="form-group">
                            <label className="form-label">🛠 Tech Stack</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="e.g. React, Node.js, MongoDB"
                                value={form.techStack}
                                onChange={(e) => handleChange('techStack', e.target.value)}
                            />
                        </div>

                        {/* Status */}
                        <div className="form-group">
                            <label className="form-label">📌 Status</label>
                            <select
                                className="form-input"
                                value={form.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Progress Slider */}
                        <div className="form-group full">
                            <label className="form-label">
                                📊 Progress
                                <span className="progress-label-val">{form.progress}%</span>
                            </label>
                            <div className="slider-wrap">
                                <input
                                    className="form-slider"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={form.progress}
                                    onChange={(e) => handleChange('progress', Number(e.target.value))}
                                    style={{ '--pct': `${form.progress}%`, '--color': form.color }}
                                />
                                <div className="slider-track-fill" style={{ width: `${form.progress}%`, background: form.color }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>0%</span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>100%</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group full">
                            <label className="form-label">📝 Description</label>
                            <textarea
                                className="form-input form-textarea"
                                placeholder="Brief description of the project, goals, features..."
                                value={form.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Color picker */}
                        <div className="form-group full">
                            <label className="form-label">🎨 Project Color</label>
                            <div className="color-picker">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => handleChange('color', c)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? '⏳ Saving...' : mode === 'create' ? '🚀 Create Project' : '💾 Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────
function DeleteConfirm({ project, onCancel, onConfirm, deleting }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">🗑 Delete Project</h2>
                    <button className="modal-close" onClick={onCancel}>✕</button>
                </div>
                <div className="modal-body">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>
                        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{project.name}</strong>?
                    </p>
                    <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                        ⚠️ This action cannot be undone.
                    </p>
                    <div className="modal-footer" style={{ marginTop: 24 }}>
                        <button className="btn-secondary" onClick={onCancel} disabled={deleting}>Cancel</button>
                        <button
                            className="btn-danger"
                            onClick={onConfirm}
                            disabled={deleting}
                        >
                            {deleting ? '⏳ Deleting...' : '🗑 Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Project Card ─────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete }) {
    const statusClass = project.status === 'done' ? 'done'
        : project.status === 'paused' ? 'medium'
            : project.status === 'planning' ? 'new'
                : 'active';

    const timeSince = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days === 1) return '1d ago';
        return `${days}d ago`;
    };

    return (
        <div className="card project-card">
            <div style={{ height: 4, background: project.color, borderRadius: '14px 14px 0 0' }}></div>
            <div className="card-body">
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {project.name}
                        </div>
                        {project.techStack && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{project.techStack}</div>
                        )}
                    </div>
                    <span className={`badge ${statusClass}`}>{project.status}</span>
                </div>

                {/* Description */}
                {project.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {project.description}
                    </p>
                )}

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>Progress</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }}></div>
                    </div>
                    <span className="progress-pct">{project.progress}%</span>
                </div>

                {/* Links */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {project.githubLink && (
                        <a href={project.githubLink} target="_blank" rel="noreferrer" className="project-link github" onClick={(e) => e.stopPropagation()}>
                            ⎇ GitHub
                        </a>
                    )}
                    {project.liveLink && (
                        <a href={project.liveLink} target="_blank" rel="noreferrer" className="project-link live" onClick={(e) => e.stopPropagation()}>
                            ↗ Live
                        </a>
                    )}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {timeSince(project.updatedAt)}
                    </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-edit" onClick={() => onEdit(project)}>
                        ✏️ Edit
                    </button>
                    <button className="btn-del" onClick={() => onDelete(project)}>
                        🗑
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Projects Page ───────────────────────────────
export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [filter, setFilter] = useState('all');

    // Load projects
    const loadProjects = async () => {
        setLoading(true);
        setApiError('');
        try {
            const res = await fetchProjects();
            if (res.success) setProjects(res.data);
            else setApiError(res.message || 'Failed to load projects');
        } catch {
            setApiError('Cannot reach server. Make sure the backend is running on port 5000.');
        }
        setLoading(false);
    };

    useEffect(() => { loadProjects(); }, []);

    // Create
    const handleCreate = async (form) => {
        const res = await createProject(form);
        if (res.success) {
            setProjects((prev) => [res.data, ...prev]);
            setShowCreate(false);
        } else {
            alert(res.message || 'Failed to create project');
        }
    };

    // Update
    const handleUpdate = async (form) => {
        const res = await updateProject(editTarget._id, form);
        if (res.success) {
            setProjects((prev) => prev.map((p) => (p._id === res.data._id ? res.data : p)));
            setEditTarget(null);
        } else {
            alert(res.message || 'Failed to update project');
        }
    };

    // Delete
    const handleDelete = async () => {
        setDeleting(true);
        const res = await deleteProject(deleteTarget._id);
        if (res.success) {
            setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
            setDeleteTarget(null);
        } else {
            alert(res.message || 'Failed to delete project');
        }
        setDeleting(false);
    };

    // Filtered projects
    const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter);

    // Stats
    const stats = {
        total: projects.length,
        active: projects.filter((p) => p.status === 'active').length,
        done: projects.filter((p) => p.status === 'done').length,
        avgProgress: projects.length ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0,
    };

    return (
        <div className="page-content">
            {/* Stats row */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card accent">
                    <div className="stat-header">
                        <div className="stat-icon-wrap accent">📁</div>
                    </div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Projects</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-header">
                        <div className="stat-icon-wrap success">🚀</div>
                    </div>
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-header">
                        <div className="stat-icon-wrap warning">✅</div>
                    </div>
                    <div className="stat-value">{stats.done}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-header">
                        <div className="stat-icon-wrap cyan">📊</div>
                    </div>
                    <div className="stat-value">{stats.avgProgress}%</div>
                    <div className="stat-label">Avg. Progress</div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'active', 'planning', 'paused', 'done'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid',
                                borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                                background: filter === f ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: filter === f ? 'var(--accent-light)' : 'var(--text-muted)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s',
                            }}
                        >
                            {f === 'all' ? `All (${stats.total})` : f}
                        </button>
                    ))}
                </div>

                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    + New Project
                </button>
            </div>

            {/* Error */}
            {apiError && (
                <div style={{ padding: '14px 18px', background: 'var(--danger-bg)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.82rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    ⚠️ {apiError}
                    <button onClick={loadProjects} style={{ fontSize: '0.75rem', color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Retry ↺</button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '0.85rem', gap: 10 }}>
                    <span style={{ animation: 'pulse 1.2s ease infinite' }}>⏳</span> Loading projects...
                </div>
            )}

            {/* Empty state */}
            {!loading && !apiError && filtered.length === 0 && (
                <div className="placeholder-page" style={{ minHeight: 320 }}>
                    <div className="placeholder-icon">🚀</div>
                    <div className="placeholder-title">No projects {filter !== 'all' ? `with status "${filter}"` : 'yet'}</div>
                    <div className="placeholder-desc">Click "New Project" to add your first project and start tracking your work.</div>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create First Project</button>
                </div>
            )}

            {/* Project Grid */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {filtered.map((p) => (
                        <ProjectCard
                            key={p._id}
                            project={p}
                            onEdit={setEditTarget}
                            onDelete={setDeleteTarget}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <ProjectModal mode="create" onClose={() => setShowCreate(false)} onSave={handleCreate} />
            )}

            {/* Edit Modal */}
            {editTarget && (
                <ProjectModal
                    mode="edit"
                    initial={{
                        name: editTarget.name,
                        description: editTarget.description,
                        githubLink: editTarget.githubLink,
                        liveLink: editTarget.liveLink,
                        techStack: editTarget.techStack,
                        progress: editTarget.progress,
                        status: editTarget.status,
                        color: editTarget.color,
                    }}
                    onClose={() => setEditTarget(null)}
                    onSave={handleUpdate}
                />
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <DeleteConfirm
                    project={deleteTarget}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    deleting={deleting}
                />
            )}
        </div>
    );
}
