import React, { useState, useEffect } from 'react';
import {
    BookOpen, TrendingUp, Clock, FileText, CheckCircle,
    Plus, ChevronLeft, Book, Star, Activity, Edit3, Trash2
} from 'lucide-react';
import './Reading.css';

const API_BASE = 'http://localhost:5000/api/reading';

export default function Reading() {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'detail'
    const [selectedBookId, setSelectedBookId] = useState(null);

    // Dashboard Data
    const [stats, setStats] = useState(null);
    const [genres, setGenres] = useState([]);
    const [genreAnalytics, setGenreAnalytics] = useState([]);
    const [books, setBooks] = useState([]);

    // Modals
    const [showAddBook, setShowAddBook] = useState(false);
    const [showLogSession, setShowLogSession] = useState(false);
    const [showAddNote, setShowAddNote] = useState(false);

    // Form states
    const [selectedGenreFilter, setSelectedGenreFilter] = useState('');
    const [newBook, setNewBook] = useState({ title: '', author: '', totalPages: '', genre: '', status: 'wishlist', whyReading: '', lifeImplementation: '', rating: 0, readMonthYear: '' });
    const [sessionData, setSessionData] = useState({ pagesRead: '', durationMinutes: '', currentPage: '' });
    const [noteData, setNoteData] = useState({ content: '', chapter: '' });

    // Detail Data
    const [bookDetail, setBookDetail] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        if (view === 'dashboard') {
            fetchDashboardData();
        } else if (view === 'detail' && selectedBookId) {
            fetchBookDetails(selectedBookId);
        }
    }, [view, selectedBookId]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, genresRes, analyticsRes, booksRes] = await Promise.all([
                fetch(`${API_BASE}/dashboard/stats`),
                fetch(`${API_BASE}/genres`),
                fetch(`${API_BASE}/genres/analytics`),
                fetch(`${API_BASE}`)
            ]);

            const statsData = await statsRes.json();
            const genresData = await genresRes.json();
            const analyticsData = await analyticsRes.json();
            const booksData = await booksRes.json();

            setStats(statsData.data);
            setGenres(genresData.data);
            setGenreAnalytics(analyticsData.data);
            setBooks(booksData.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

    const fetchBookDetails = async (id) => {
        try {
            const [bookRes, sessionsRes, notesRes] = await Promise.all([
                fetch(`${API_BASE}/${id}`),
                fetch(`${API_BASE}/${id}/sessions`),
                fetch(`${API_BASE}/${id}/notes`)
            ]);

            const bookData = await bookRes.json();
            const sessionsData = await sessionsRes.json();
            const notesData = await notesRes.json();

            setBookDetail(bookData.data);
            setSessions(sessionsData.data);
            setNotes(notesData.data);

            // pre-fill current page for session log
            setSessionData(prev => ({ ...prev, currentPage: bookData.data.currentPage }));
        } catch (error) {
            console.error("Failed to fetch book details:", error);
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newBook, totalPages: parseInt(newBook.totalPages), rating: parseInt(newBook.rating) };
            if (!payload.rating) delete payload.rating;

            const res = await fetch(`${API_BASE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowAddBook(false);
                setNewBook({ title: '', author: '', totalPages: '', genre: '', status: 'wishlist', whyReading: '', lifeImplementation: '', rating: 0, readMonthYear: '' });
                fetchDashboardData();
            }
        } catch (error) {
            console.error("Failed to add book:", error);
        }
    };

    const handleLogSession = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                currentPage: parseInt(sessionData.currentPage),
                pagesRead: parseInt(sessionData.pagesRead),
                durationMinutes: parseInt(sessionData.durationMinutes)
            };
            const res = await fetch(`${API_BASE}/${selectedBookId}/progress`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowLogSession(false);
                setSessionData({ pagesRead: '', durationMinutes: '', currentPage: '' });
                fetchBookDetails(selectedBookId);
            }
        } catch (error) {
            console.error("Failed to log session:", error);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/${selectedBookId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            if (res.ok) {
                setShowAddNote(false);
                setNoteData({ content: '', chapter: '' });
                fetchBookDetails(selectedBookId);
            }
        } catch (error) {
            console.error("Failed to add note:", error);
        }
    };

    const deleteNote = async (noteId) => {
        try {
            const res = await fetch(`${API_BASE}/notes/${noteId}`, { method: 'DELETE' });
            if (res.ok) fetchBookDetails(selectedBookId);
        } catch (error) {
            console.error("Failed to delete note:", error);
        }
    };

    // Rendering helpers
    const renderProgressBar = (current, total) => {
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        return (
            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                </div>
                <span className="progress-text">{percent}% ({current}/{total})</span>
            </div>
        );
    };

    if (view === 'detail' && selectedBookId) {
        if (!bookDetail) return <div className="loading">Loading details...</div>;

        return (
            <div className="reading-container">
                <div className="detail-header">
                    <button className="back-btn" onClick={() => setView('dashboard')}>
                        <ChevronLeft size={20} /> Back to Dashboard
                    </button>
                </div>

                <div className="book-detail-grid">
                    <div className="book-detail-main">
                        <div className="glass-card book-hero">
                            <h1 className="book-title">{bookDetail.title}</h1>
                            <p className="book-author">by {bookDetail.author}</p>
                            <div className="book-badges">
                                <span className="badge genre-badge">{bookDetail.genre?.name}</span>
                                <span className={`badge status-badge ${bookDetail.status}`}>{bookDetail.status}</span>
                            </div>

                            <div className="progress-section mt-4">
                                <h3>Reading Progress</h3>
                                {renderProgressBar(bookDetail.currentPage, bookDetail.totalPages)}
                            </div>

                            <button className="btn btn-primary mt-4" onClick={() => setShowLogSession(true)}>
                                <Activity size={18} /> Update Progress
                            </button>
                        </div>

                        {(bookDetail.whyReading || bookDetail.lifeImplementation) && (
                            <div className="glass-card mt-4">
                                {bookDetail.whyReading && (
                                    <div className="info-block">
                                        <h3><BookOpen size={18} /> Why I'm reading this</h3>
                                        <p>{bookDetail.whyReading}</p>
                                    </div>
                                )}
                                {bookDetail.lifeImplementation && (
                                    <div className="info-block mt-4">
                                        <h3><CheckCircle size={18} /> Life Implementation</h3>
                                        <p>{bookDetail.lifeImplementation}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="glass-card mt-4">
                            <div className="flex-between">
                                <h3>Notes</h3>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddNote(true)}>
                                    <Plus size={16} /> Add Note
                                </button>
                            </div>
                            <div className="notes-list mt-3">
                                {notes.length === 0 ? <p className="text-muted">No notes yet.</p> : notes.map(note => (
                                    <div key={note._id} className="note-card">
                                        {note.chapter && <span className="note-chapter">Chapter/Section: {note.chapter}</span>}
                                        <p className="note-content">{note.content}</p>
                                        <div className="note-actions">
                                            <span className="note-date">{new Date(note.createdAt).toLocaleDateString()}</span>
                                            <button className="icon-btn delete" onClick={() => deleteNote(note._id)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="book-detail-sidebar">
                        <div className="glass-card">
                            <h3>Reading Sessions</h3>
                            <div className="sessions-list mt-3">
                                {sessions.length === 0 ? <p className="text-muted">No sessions logged.</p> : sessions.map(session => (
                                    <div key={session._id} className="session-card">
                                        <div className="session-date">{new Date(session.date).toLocaleDateString()}</div>
                                        <div className="session-metrics">
                                            <div className="metric">
                                                <TrendingUp size={14} /> {session.pagesRead} pages
                                            </div>
                                            <div className="metric">
                                                <Clock size={14} /> {session.durationMinutes} min
                                            </div>
                                            <div className="metric speed">
                                                {(session.pagesRead / session.durationMinutes).toFixed(1)} p/m
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOG SESSION MODAL */}
                {showLogSession && (
                    <div className="modal-overlay">
                        <div className="modal-content glass-card form-box">
                            <h2>Log Reading Session</h2>
                            <form onSubmit={handleLogSession}>
                                <div className="form-group">
                                    <label>Current Page Reached</label>
                                    <input type="number" required value={sessionData.currentPage} onChange={e => setSessionData({ ...sessionData, currentPage: e.target.value })} max={bookDetail.totalPages} />
                                </div>
                                <div className="form-group row">
                                    <div className="col">
                                        <label>Pages Read in Session</label>
                                        <input type="number" required value={sessionData.pagesRead} onChange={e => setSessionData({ ...sessionData, pagesRead: e.target.value })} />
                                    </div>
                                    <div className="col">
                                        <label>Duration (Minutes)</label>
                                        <input type="number" required value={sessionData.durationMinutes} onChange={e => setSessionData({ ...sessionData, durationMinutes: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowLogSession(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Session</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ADD NOTE MODAL */}
                {showAddNote && (
                    <div className="modal-overlay">
                        <div className="modal-content glass-card form-box">
                            <h2>Add Book Note</h2>
                            <form onSubmit={handleAddNote}>
                                <div className="form-group">
                                    <label>Chapter / Topic (Optional)</label>
                                    <input type="text" value={noteData.chapter} onChange={e => setNoteData({ ...noteData, chapter: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Note Content</label>
                                    <textarea required rows="4" value={noteData.content} onChange={e => setNoteData({ ...noteData, content: e.target.value })}></textarea>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddNote(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Note</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // DASHBOARD VIEW
    const filteredBooks = selectedGenreFilter ? books.filter(b => b.genre?._id === selectedGenreFilter || b.genre?.name === selectedGenreFilter) : books;

    // Group dynamically by status
    const bookGroups = {};
    filteredBooks.forEach(b => {
        const s = b.status || 'other';
        if (!bookGroups[s]) bookGroups[s] = [];
        bookGroups[s].push(b);
    });

    const readingBooks = bookGroups['reading'] || [];
    const completedBooks = bookGroups['completed'] || [];
    const wishlistBooks = bookGroups['wishlist'] || [];
    const customStatuses = Object.keys(bookGroups).filter(s => !['reading', 'completed', 'wishlist'].includes(s));

    const filteredAnalytics = selectedGenreFilter
        ? genreAnalytics.filter(g => g.totalBooks > 0 && genres.find(genre => genre._id === selectedGenreFilter || genre.name === selectedGenreFilter)?.name === g.genre)
        : genreAnalytics.filter(g => g.totalBooks > 0);

    const uniqueStatuses = Array.from(new Set(books.map(b => b.status).filter(Boolean)));

    const getManualDate = (book) => {
        const titleLower = book.title?.toLowerCase() || '';
        if (titleLower.includes('rich dad poor dad')) return 'Nov 2024';
        if (titleLower.includes('ikigai')) return 'Oct 2025';
        return book.readMonthYear ? book.readMonthYear : '';
    };

    return (
        <div className="reading-container">
            <div className="reading-header">
                <div>
                    <h1 className="page-title">Reading Tracker</h1>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                        <p className="page-subtitle" style={{ margin: 0 }}>Nourish your mind, track your journey.</p>
                        <select
                            className="genre-filter-select glass-card"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                            value={selectedGenreFilter}
                            onChange={e => setSelectedGenreFilter(e.target.value)}
                        >
                            <option value="">All Genres</option>
                            {genres.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddBook(true)}>
                    <Plus size={20} /> Add New Book
                </button>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><Book size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Books</h3>
                            <p>{stats.totalBooks}</p>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><FileText size={24} /></div>
                        <div className="stat-info">
                            <h3>Pages Read</h3>
                            <p>{stats.totalPagesRead}</p>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><Activity size={24} /></div>
                        <div className="stat-info">
                            <h3>Avg Speed</h3>
                            <p>{stats.averageSpeed} <small>pg/min</small></p>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><TrendingUp size={24} /></div>
                        <div className="stat-info">
                            <h3>Streak</h3>
                            <p>{stats.streak} <small>days</small></p>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="books-section">
                    {readingBooks.length > 0 && (
                        <div className="book-group">
                            <h2 className="group-title">Currently Reading</h2>
                            <div className="book-list">
                                {readingBooks.map(book => (
                                    <div key={book._id} className="book-card glass-card" onClick={() => { setSelectedBookId(book._id); setView('detail'); }}>
                                        <div className="book-card-header">
                                            <h3>{book.title}</h3>
                                            <span className="badge genre-badge">{book.genre?.name}</span>
                                        </div>
                                        <p className="book-author">{book.author}</p>
                                        <div className="mt-3">
                                            {renderProgressBar(book.currentPage, book.totalPages)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="book-tabs mt-4">
                        <div className="book-group">
                            <h2 className="group-title">Completed Books</h2>
                            <div className="book-list mixed">
                                {completedBooks.map(book => (
                                    <div key={book._id} className="book-item glass-card" onClick={() => { setSelectedBookId(book._id); setView('detail'); }}>
                                        <div>
                                            <h4>{book.title}</h4>
                                            <p>{book.author} {getManualDate(book) && <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '6px' }}>• read in {getManualDate(book)}</span>}</p>
                                        </div>
                                        <span className="badge completed">Completed</span>
                                    </div>
                                ))}
                                {completedBooks.length === 0 && <p className="text-muted">No completed books yet.</p>}
                            </div>
                        </div>

                        <div className="book-group">
                            <h2 className="group-title">Wishlist</h2>
                            <div className="book-list mixed">
                                {wishlistBooks.map(book => (
                                    <div key={book._id} className="book-item glass-card" onClick={() => { setSelectedBookId(book._id); setView('detail'); }}>
                                        <div>
                                            <h4>{book.title}</h4>
                                            <p>{book.author}</p>
                                        </div>
                                        <span className="badge wishlist">Wishlist</span>
                                    </div>
                                ))}
                                {wishlistBooks.length === 0 && <p className="text-muted">Wishlist is empty.</p>}
                            </div>
                        </div>

                        {customStatuses.map(status => (
                            <div className="book-group" key={status} style={{ marginTop: '24px' }}>
                                <h2 className="group-title" style={{ textTransform: 'capitalize' }}>{status}</h2>
                                <div className="book-list mixed">
                                    {bookGroups[status].map(book => (
                                        <div key={book._id} className="book-item glass-card" onClick={() => { setSelectedBookId(book._id); setView('detail'); }}>
                                            <div>
                                                <h4>{book.title}</h4>
                                                <p>{book.author} {getManualDate(book) && <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '6px' }}>• added in {getManualDate(book)}</span>}</p>
                                            </div>
                                            <span className="badge wishlist" style={{ textTransform: 'capitalize' }}>{status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="genres-section">
                    <div className="glass-card">
                        <h2 className="group-title">Genre Analytics</h2>
                        <div className="genre-cards">
                            {filteredAnalytics.map(g => (
                                <div key={g.genre} className="genre-analytic-item">
                                    <div className="flex-between">
                                        <h4>{g.genre}</h4>
                                        <span className="genre-stat">{g.totalBooks} books</span>
                                    </div>
                                    <div className="progress-container mini">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${g.completionRate}%` }}></div>
                                        </div>
                                        <span className="progress-text">{g.completionRate}% completed</span>
                                    </div>
                                    <div className="genre-meta text-muted mt-1">
                                        {g.totalPagesRead} pages read
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ADD BOOK MODAL */}
            {showAddBook && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card form-box add-book-modal">
                        <h2>Add New Book</h2>
                        <form onSubmit={handleAddBook}>
                            <div className="form-group row">
                                <div className="col flex-2">
                                    <label>Title</label>
                                    <input type="text" required value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} />
                                </div>
                                <div className="col">
                                    <label>Status</label>
                                    <input required list="status-options" placeholder="Select or type new status" value={newBook.status} onChange={e => setNewBook({ ...newBook, status: e.target.value })} />
                                    <datalist id="status-options">
                                        <option value="wishlist" />
                                        <option value="reading" />
                                        <option value="completed" />
                                        {uniqueStatuses.filter(s => !['wishlist', 'reading', 'completed'].includes(s)).map(s => (
                                            <option key={s} value={s} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="col">
                                    <label>Author</label>
                                    <input type="text" required value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} />
                                </div>
                                <div className="col">
                                    <label>Total Pages</label>
                                    <input type="number" required value={newBook.totalPages} onChange={e => setNewBook({ ...newBook, totalPages: e.target.value })} />
                                </div>
                                <div className="col">
                                    <label>Genre</label>
                                    <input required list="genre-options" placeholder="Select or type new" value={newBook.genre} onChange={e => setNewBook({ ...newBook, genre: e.target.value })} />
                                    <datalist id="genre-options">
                                        {genres.map(g => (
                                            <option key={g._id} value={g.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="col">
                                    <label>Date Added/Read (e.g. Nov 2024)</label>
                                    <input type="text" placeholder="Optional" value={newBook.readMonthYear} onChange={e => setNewBook({ ...newBook, readMonthYear: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Why are you reading this?</label>
                                <textarea rows="2" value={newBook.whyReading} onChange={e => setNewBook({ ...newBook, whyReading: e.target.value })}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Life Implementation (What to apply)</label>
                                <textarea rows="2" value={newBook.lifeImplementation} onChange={e => setNewBook({ ...newBook, lifeImplementation: e.target.value })}></textarea>
                            </div>

                            <div className="modal-actions mt-4">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBook(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Book</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
