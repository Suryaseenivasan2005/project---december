import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const DEV_USER_ID = localStorage.getItem('jarvis_user_id') || '';

// Session token is kept in memory only — never localStorage for security
let vaultTokenInMemory = null;
let tokenExpiryTimer = null;

const authHeaders = (includeVault = false) => {
    const h = { 'Content-Type': 'application/json', 'x-user-id': DEV_USER_ID };
    if (includeVault && vaultTokenInMemory) h['x-vault-token'] = vaultTokenInMemory;
    return h;
};

// ─── File icon helper ─────────────────────────────────────────────────────────
const fileIcon = (mimeType = '', name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf' || ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📋';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (mimeType === 'text/plain') return '📃';
    return '📁';
};

const categoryColor = (cat) => ({
    Documents: 'var(--accent)',
    Images: 'var(--success)',
    Work: 'var(--purple)',
    Others: 'var(--cyan)',
}[cat] || 'var(--text-muted)');

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// PIN input (6 boxes)
function PinInput({ value, onChange, disabled }) {
    const inputs = Array.from({ length: 6 });
    const refs = useRef([]);

    const handleKey = (i, e) => {
        if (e.key === 'Backspace') {
            if (value[i]) {
                const next = value.split('');
                next[i] = '';
                onChange(next.join(''));
            } else if (i > 0) {
                refs.current[i - 1]?.focus();
            }
        }
    };

    const handleChange = (i, e) => {
        const digit = e.target.value.replace(/\D/g, '').slice(-1);
        const next = value.padEnd(6, ' ').split('');
        next[i] = digit;
        const newVal = next.join('').trimEnd();
        onChange(newVal);
        if (digit && i < 5) refs.current[i + 1]?.focus();
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted);
        refs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {inputs.map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (refs.current[i] = el)}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKey(i, e)}
                    onPaste={handlePaste}
                    style={{
                        width: 48, height: 56, borderRadius: 12,
                        border: value[i] ? '2px solid var(--accent)' : '2px solid var(--border)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)',
                        fontSize: '1.4rem', textAlign: 'center', outline: 'none',
                        fontFamily: 'Space Grotesk', fontWeight: 700,
                        transition: 'border-color 0.2s',
                        caretColor: 'transparent',
                    }}
                />
            ))}
        </div>
    );
}

// Modal backdrop + box
function Modal({ children, onClose }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fade-in 0.2s ease',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400,
                boxShadow: 'var(--shadow-lg)', animation: 'slide-up 0.25s ease',
            }} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

// Share modal
function ShareModal({ file, shareData, onClose }) {
    const [copied, setCopied] = useState(false);
    const url = shareData?.shareUrl || '';

    const copy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const whatsapp = () =>
        window.open(`https://wa.me/?text=${encodeURIComponent(`📎 ${file.name}: ${url}`)}`, '_blank');

    const email = () =>
        window.open(`mailto:?subject=Sharing: ${encodeURIComponent(file.name)}&body=${encodeURIComponent(`Here is the shared file link:\n${url}\n\nThis link expires in 24 hours.`)}`, '_blank');

    return (
        <Modal onClose={onClose}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔗</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Share File</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{file.name}</div>
            </div>

            {/* URL box */}
            <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                fontSize: '0.72rem', color: 'var(--text-secondary)',
                wordBreak: 'break-all', lineHeight: 1.6,
            }}>
                {url}
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
                ⏳ Expires in 24 hours
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                <button onClick={copy} style={btnStyle(copied ? 'var(--success)' : 'var(--accent)')}>
                    {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={whatsapp} style={{ ...btnStyle('#25D366'), flex: 1, fontSize: '0.78rem' }}>
                        WhatsApp 💬
                    </button>
                    <button onClick={email} style={{ ...btnStyle('var(--purple)'), flex: 1, fontSize: '0.78rem' }}>
                        Email 📧
                    </button>
                </div>
                <button onClick={onClose} style={{ ...btnStyle('transparent', true), marginTop: 4 }}>
                    Close
                </button>
            </div>
        </Modal>
    );
}

const btnStyle = (bg = 'var(--accent)', ghost = false) => ({
    width: '100%', padding: '11px 0',
    background: ghost ? 'transparent' : bg,
    border: ghost ? '1px solid var(--border)' : 'none',
    borderRadius: 10, color: ghost ? 'var(--text-muted)' : 'white',
    fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
});

// Countdown timer text component
function Countdown({ seconds }) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{m}:{String(s).padStart(2, '0')}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DOCUMENT VAULT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentVault() {
    // ── State ────────────────────────────────────────────────────────────
    const [vaultState, setVaultState] = useState('checking'); // checking | locked | pinSetup | unlocked
    const [pinStatus, setPinStatus] = useState(null);         // hasPinSet, isLockedOut, etc.
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [sessionLeft, setSessionLeft] = useState(600);     // seconds
    const [files, setFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null); // file id pending delete
    const [shareModal, setShareModal] = useState(null);       // { file, shareData }
    const [sharing, setSharing] = useState(null);             // file id being shared
    const [lockTimer, setLockTimer] = useState(null);         // countdown for lockout
    const [activeCategory, setActiveCategory] = useState('All');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const sessionTimerRef = useRef(null);
    const lockTimerRef = useRef(null);

    // ── Fetch vault status on mount ───────────────────────────────────────
    const fetchStatus = useCallback(async () => {
        if (!DEV_USER_ID) { setVaultState('noUser'); return; }
        try {
            const res = await fetch(`${API_BASE}/vault/status`, {
                headers: { 'x-user-id': DEV_USER_ID },
            });
            const json = await res.json();
            if (json.success) {
                setPinStatus(json.data);
                if (json.data.isLockedOut) {
                    setVaultState('locked');
                    startLockCountdown(json.data.lockRemainingSeconds);
                } else if (json.data.hasPinSet) {
                    setVaultState('locked');
                } else {
                    setVaultState('pinSetup');
                }
            }
        } catch {
            setVaultState('error');
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    // ── Start lockout visual countdown ────────────────────────────────────
    const startLockCountdown = (seconds) => {
        setLockTimer(seconds);
        clearInterval(lockTimerRef.current);
        lockTimerRef.current = setInterval(() => {
            setLockTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(lockTimerRef.current);
                    setVaultState('locked');
                    setPinStatus((p) => ({ ...p, isLockedOut: false }));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // ── Vault session countdown (auto-locks at 0) ─────────────────────────
    const startSessionTimer = (seconds = 600) => {
        setSessionLeft(seconds);
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = setInterval(() => {
            setSessionLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(sessionTimerRef.current);
                    handleAutoLock();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleAutoLock = () => {
        vaultTokenInMemory = null;
        setVaultState('locked');
        setFiles([]);
        setPin('');
        setPinError('');
        setPinStatus((p) => ({ ...p, attemptsLeft: 3, failedAttempts: 0 }));
    };

    const handleManualLock = () => {
        clearInterval(sessionTimerRef.current);
        handleAutoLock();
    };

    // ── Set PIN (first time) ──────────────────────────────────────────────
    const handleSetPin = async () => {
        setPinError('');
        if (!/^\d{6}$/.test(pin)) return setPinError('PIN must be exactly 6 digits.');
        if (pin !== confirmPin) return setPinError('PINs do not match. Please try again.');

        setPinLoading(true);
        try {
            const res = await fetch(`${API_BASE}/vault/set-pin`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ pin }),
            });
            const json = await res.json();
            if (json.success) {
                setPinStatus((p) => ({ ...p, hasPinSet: true }));
                setPin(''); setConfirmPin('');
                setVaultState('locked');
            } else {
                setPinError(json.message || 'Failed to set PIN.');
            }
        } catch {
            setPinError('Cannot reach server.');
        } finally {
            setPinLoading(false);
        }
    };

    // ── Unlock vault ──────────────────────────────────────────────────────
    const handleUnlock = async () => {
        if (!/^\d{6}$/.test(pin)) return setPinError('Enter all 6 digits.');
        setPinError('');
        setPinLoading(true);
        try {
            const res = await fetch(`${API_BASE}/vault/unlock`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ pin }),
            });
            const json = await res.json();
            if (json.success) {
                vaultTokenInMemory = json.vaultToken;
                setPin('');
                setVaultState('unlocked');
                startSessionTimer(json.expiresIn || 600);
                fetchFiles();
            } else {
                setPin('');
                if (json.locked) {
                    setPinError(`Vault locked. Try again in ${lockTimer} minutes.`);
                    startLockCountdown(300);
                } else {
                    setPinError(json.message || 'Incorrect PIN.');
                    setPinStatus((p) => ({ ...p, attemptsLeft: json.attemptsLeft ?? p.attemptsLeft - 1 }));
                }
            }
        } catch {
            setPinError('Cannot reach server.');
        } finally {
            setPinLoading(false);
        }
    };

    // ── Fetch files ───────────────────────────────────────────────────────
    const fetchFiles = useCallback(async () => {
        setFilesLoading(true);
        try {
            const res = await fetch(`${API_BASE}/vault/files`, {
                headers: authHeaders(true),
            });
            const json = await res.json();
            if (json.success) setFiles(json.data || []);
        } catch {
            // silent
        } finally {
            setFilesLoading(false);
        }
    }, []);

    // ── Upload file ───────────────────────────────────────────────────────
    const handleUpload = async (fileObj) => {
        if (!fileObj) return;
        setUploading(true);
        setUploadError('');
        const fd = new FormData();
        fd.append('file', fileObj);
        try {
            const res = await fetch(`${API_BASE}/vault/upload`, {
                method: 'POST',
                headers: { 'x-user-id': DEV_USER_ID, 'x-vault-token': vaultTokenInMemory || '' },
                body: fd,
            });
            const json = await res.json();
            if (json.success) {
                setFiles((prev) => [json.data, ...prev]);
            } else {
                setUploadError(json.message || 'Upload failed.');
            }
        } catch {
            setUploadError('Upload failed — server unreachable.');
        } finally {
            setUploading(false);
        }
    };

    // ── Delete file ───────────────────────────────────────────────────────
    const handleDelete = async (fileId) => {
        try {
            await fetch(`${API_BASE}/vault/${fileId}`, {
                method: 'DELETE',
                headers: authHeaders(true),
            });
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
        } catch {
            // silent
        } finally {
            setDeleteConfirm(null);
        }
    };

    // ── Share file ────────────────────────────────────────────────────────
    const handleShare = async (file) => {
        setSharing(file.id);
        try {
            const res = await fetch(`${API_BASE}/vault/share/${file.id}`, {
                method: 'POST',
                headers: authHeaders(true),
            });
            const json = await res.json();
            if (json.success) setShareModal({ file, shareData: json.data });
        } catch {
            // silent
        } finally {
            setSharing(null);
        }
    };

    // ── View/Open file ───────────────────────────────────────────────────
    const handleViewFile = async (file) => {
        try {
            const res = await fetch(`${API_BASE}/vault/view/${file.id}`, {
                headers: authHeaders(true),
            });
            if (!res.ok) throw new Error('Failed to load file');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Note: In a production app, you might want to revoke the URL after a while
            // setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            alert('Could not open file preview.');
        }
    };

    // ── Drag & drop handlers ──────────────────────────────────────────────
    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleUpload(f);
    };

    // ── Filtered files ────────────────────────────────────────────────────
    const displayFiles = activeCategory === 'All' ? files : files.filter((f) => f.category === activeCategory);
    const categories = ['All', 'Documents', 'Images', 'Work', 'Others'];

    // ── Storage summary counts ────────────────────────────────────────────
    const totalSize = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
    const fmtTotal = totalSize < 1024 * 1024
        ? `${(totalSize / 1024).toFixed(1)} KB`
        : `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;

    // ── Renders ───────────────────────────────────────────────────────────

    // GLOBAL STYLES
    const globalStyle = `
        @keyframes fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes slide-up { from { opacity:0;transform:translateY(20px) } to { opacity:1;transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 50%{box-shadow:0 0 0 12px rgba(99,102,241,0)} }
        .vault-file-card { 
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: 14px; padding: 18px; transition: all 0.25s;
            display: flex; flex-direction: column; gap: 10px; position: relative;
            overflow: hidden;
        }
        .vault-file-card:hover { 
            border-color: rgba(99,102,241,0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .vault-btn {
            border: none; border-radius: 8px; padding: 6px 12px;
            font-family: inherit; font-size: 0.72rem; font-weight: 700;
            cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px;
        }
        .vault-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .pin-action-btn {
            width: 100%; padding: 13px; margin-top: 6px;
            background: linear-gradient(135deg, var(--accent), var(--purple));
            border: none; border-radius: 12px; color: white;
            font-family: inherit; font-size: 0.88rem; font-weight: 700;
            cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em;
        }
        .pin-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pin-action-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 24px rgba(99,102,241,0.35); }
        .cat-pill {
            padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border);
            font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
            font-family: inherit; background: transparent; color: var(--text-muted);
        }
        .cat-pill.active { 
            background: linear-gradient(135deg, var(--accent), var(--purple));
            border-color: transparent; color: white;
        }
        .cat-pill:hover:not(.active) { border-color: var(--border-accent); color: var(--text-primary); }
        .drop-zone {
            border: 2px dashed var(--border); border-radius: 14px; padding: 32px;
            text-align: center; cursor: pointer; transition: all 0.2s; background: transparent;
        }
        .drop-zone.dragover { border-color: var(--accent); background: rgba(99,102,241,0.05); }
        .drop-zone:hover { border-color: var(--border-accent); background: rgba(99,102,241,0.03); }
    `;

    // ── No user ID state ──────────────────────────────────────────────────
    if (vaultState === 'noUser') {
        return (
            <div className="page-content">
                <style>{globalStyle}</style>
                <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔧</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>Dev Setup Required</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                        Set your User ID in the browser console:<br />
                        <code style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 5, fontSize: '0.75rem' }}>
                            localStorage.setItem('jarvis_user_id', '&lt;mongo_id&gt;')
                        </code><br />
                        Then reload.
                    </div>
                </div>
            </div>
        );
    }

    // ── PIN SETUP MODAL (first time) ──────────────────────────────────────
    if (vaultState === 'pinSetup') {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 128px)' }}>
                <style>{globalStyle}</style>
                <div style={{ width: '100%', maxWidth: 400 }}>
                    {/* Vault icon */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 72, height: 72, margin: '0 auto 16px',
                            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', boxShadow: '0 0 32px rgba(99,102,241,0.35)',
                            animation: 'pulse-ring 2.5s infinite',
                        }}>🔐</div>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Secure Your Vault</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Create a 6-digit PIN to protect your files</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>Enter PIN</label>
                        <PinInput value={pin} onChange={setPin} disabled={pinLoading} />

                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12, marginTop: 24 }}>Confirm PIN</label>
                        <PinInput value={confirmPin} onChange={setConfirmPin} disabled={pinLoading} />

                        {pinError && (
                            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--danger)', textAlign: 'center' }}>
                                {pinError}
                            </div>
                        )}

                        <button
                            className="pin-action-btn"
                            onClick={handleSetPin}
                            disabled={pinLoading || pin.length !== 6 || confirmPin.length !== 6}
                            style={{ marginTop: 24 }}
                        >
                            {pinLoading ? 'Setting PIN…' : '🔒 Create Vault PIN'}
                        </button>
                    </div>

                    <div style={{ marginTop: 16, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
                        🛡️ PIN is hashed with bcrypt — never stored in plain text<br />
                        ⚠️ You cannot recover a lost PIN
                    </div>
                </div>
            </div>
        );
    }

    // ── LOCKED STATE ──────────────────────────────────────────────────────
    if (vaultState === 'locked') {
        const lockedOut = pinStatus?.isLockedOut || lockTimer > 0;

        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 128px)' }}>
                <style>{globalStyle}</style>
                <div style={{ width: '100%', maxWidth: 400 }}>
                    {/* Vault lock icon */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 72, height: 72, margin: '0 auto 16px',
                            background: lockedOut ? 'rgba(244,63,94,0.15)' : 'linear-gradient(135deg, var(--accent), var(--purple))',
                            border: lockedOut ? '2px solid rgba(244,63,94,0.4)' : 'none',
                            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', boxShadow: lockedOut ? '0 0 32px rgba(244,63,94,0.2)' : '0 0 32px rgba(99,102,241,0.35)',
                            animation: !lockedOut ? 'pulse-ring 2.5s infinite' : 'none',
                        }}>
                            {lockedOut ? '🚫' : '🔐'}
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', fontWeight: 700, color: lockedOut ? 'var(--danger)' : 'var(--text-primary)', marginBottom: 6 }}>
                            {lockedOut ? 'Vault Locked' : 'Document Vault'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {lockedOut ? 'Too many failed attempts' : 'Enter your PIN to unlock'}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${lockedOut ? 'rgba(244,63,94,0.2)' : 'var(--border)'}`, borderRadius: 18, padding: 28 }}>
                        {lockedOut ? (
                            /* Lockout screen */
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7 }}>
                                    Vault locked due to too many failed attempts.
                                </div>
                                <div style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
                                    {lockTimer > 0 && <Countdown seconds={lockTimer} />}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>minutes remaining</div>
                            </div>
                        ) : (
                            /* PIN entry */
                            <>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 16, textAlign: 'center' }}>Enter 6-Digit PIN</label>
                                <PinInput value={pin} onChange={setPin} disabled={pinLoading} />

                                {/* Attempts indicator */}
                                {pinStatus && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: i < (3 - (pinStatus.failedAttempts || 0))
                                                    ? 'var(--success)' : 'var(--border)',
                                                transition: 'background 0.3s',
                                            }} />
                                        ))}
                                    </div>
                                )}
                                {pinStatus?.failedAttempts > 0 && (
                                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--warning)', marginTop: 8 }}>
                                        {pinStatus.attemptsLeft} attempt{pinStatus.attemptsLeft !== 1 ? 's' : ''} remaining
                                    </div>
                                )}

                                {pinError && (
                                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--danger)', textAlign: 'center' }}>
                                        {pinError}
                                    </div>
                                )}

                                <button
                                    className="pin-action-btn"
                                    onClick={handleUnlock}
                                    disabled={pinLoading || pin.length !== 6}
                                    style={{ marginTop: 24 }}
                                >
                                    {pinLoading
                                        ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                                            Verifying…
                                        </span>
                                        : '🔓 Unlock Vault'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── CHECKING STATE ────────────────────────────────────────────────────
    if (vaultState === 'checking') {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 128px)' }}>
                <style>{globalStyle}</style>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading vault…</div>
                </div>
            </div>
        );
    }

    // ── UNLOCKED STATE ────────────────────────────────────────────────────
    return (
        <div className="page-content">
            <style>{globalStyle}</style>

            {/* ── Delete confirm modal ─────────────────────────────────── */}
            {deleteConfirm && (
                <Modal onClose={() => setDeleteConfirm(null)}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗑️</div>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Delete File?</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 24 }}>This action cannot be undone. The file and all its share links will be permanently removed.</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ ...btnStyle('transparent', true), flex: 1 }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnStyle('var(--danger)'), flex: 1 }}>Delete</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Share modal ──────────────────────────────────────────── */}
            {shareModal && (
                <ShareModal
                    file={shareModal.file}
                    shareData={shareModal.shareData}
                    onClose={() => setShareModal(null)}
                />
            )}

            {/* ── Header ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-ring 2s infinite' }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>Vault Unlocked</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— auto-locks in <Countdown seconds={sessionLeft} /></span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {files.length} file{files.length !== 1 ? 's' : ''} · {fmtTotal}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                            padding: '8px 20px',
                            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                            border: 'none', borderRadius: 20, color: 'white',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                            opacity: uploading ? 0.7 : 1,
                        }}
                    >
                        {uploading
                            ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> Uploading…</>
                            : '⬆️ Upload File'
                        }
                    </button>
                    <button
                        onClick={handleManualLock}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent', border: '1px solid var(--border)',
                            borderRadius: 20, color: 'var(--text-muted)',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        🔒 Lock
                    </button>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
            />

            {/* ── Upload error ─────────────────────────────────────────── */}
            {uploadError && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, fontSize: '0.78rem', color: 'var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{uploadError}</span>
                    <button onClick={() => setUploadError('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                </div>
            )}

            {/* ── Category filter pills ────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'All' ? `All (${files.length})` : `${cat} (${files.filter((f) => f.category === cat).length})`}
                    </button>
                ))}
            </div>

            {/* ── Files grid or empty state ────────────────────────────── */}
            {filesLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: 160, borderRadius: 14, background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    ))}
                </div>
            ) : displayFiles.length === 0 ? (
                /* Drop zone / empty state */
                <div
                    className={`drop-zone ${dragOver ? 'dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>{dragOver ? '📂' : '🗂️'}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {dragOver ? 'Drop to upload' : activeCategory === 'All' ? 'Your vault is empty' : `No ${activeCategory} yet`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Drag & drop or click to upload (max 10 MB)
                    </div>
                </div>
            ) : (
                <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                >
                    {displayFiles.map((file) => (
                        <div key={file.id} className="vault-file-card">
                            {/* Category accent line */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: categoryColor(file.category), borderRadius: '14px 14px 0 0' }} />

                            {/* File icon + category */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div
                                    style={{ fontSize: '2rem', cursor: 'pointer' }}
                                    onClick={() => handleViewFile(file)}
                                    title="Click to preview"
                                >
                                    {fileIcon(file.mimeType, file.name)}
                                </div>
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                                    background: `${categoryColor(file.category)}18`,
                                    color: categoryColor(file.category),
                                }}>
                                    {file.category}
                                </span>
                            </div>

                            {/* File name */}
                            <div
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleViewFile(file)}
                                title="Click to preview"
                            >
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                                    {file.name}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    {file.size} · {new Date(file.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    className="vault-btn"
                                    onClick={() => handleViewFile(file)}
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '6px 10px' }}
                                    title="Preview"
                                >
                                    👁️
                                </button>
                                <button
                                    className="vault-btn"
                                    onClick={() => handleShare(file)}
                                    disabled={sharing === file.id}
                                    style={{ flex: 1, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-light)', justifyContent: 'center' }}
                                >
                                    {sharing === file.id ? '…' : '🔗 Share'}
                                </button>
                                <button
                                    className="vault-btn"
                                    onClick={() => setDeleteConfirm(file.id)}
                                    style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--danger)', padding: '6px 10px' }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* shimmer keyframe for loading skeletons */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}
