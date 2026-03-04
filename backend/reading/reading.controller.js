const Book = require('../models/Book');
const Genre = require('../models/Genre');
const ReadingSession = require('../models/ReadingSession');
const BookNote = require('../models/BookNote');

// GENRES
exports.getGenres = async (req, res) => {
    try {
        let genres = await Genre.find().sort('name');
        if (genres.length === 0) {
            const predefinedGenres = ['Economics', 'Rich Mindset', 'Philosophy', 'Psychology', 'Productivity', 'Leadership', 'Spirituality', 'Biography', 'Business', 'Self-Discipline'];
            await Promise.all(predefinedGenres.map(name => Genre.updateOne({ name }, { name }, { upsert: true })));
            genres = await Genre.find().sort('name');
        }
        res.status(200).json({ success: true, data: genres });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch genres' });
    }
};

exports.getGenreAnalytics = async (req, res) => {
    try {
        const genres = await Genre.find();
        const analytics = await Promise.all(genres.map(async (genre) => {
            const books = await Book.find({ genre: genre._id });
            const totalBooks = books.length;
            const completedBooks = books.filter(b => b.status === 'completed').length;
            const completionRate = totalBooks === 0 ? 0 : Math.round((completedBooks / totalBooks) * 100);

            const totalPagesRead = books.reduce((sum, book) => sum + (book.currentPage || 0), 0);

            return {
                genre: genre.name,
                totalBooks,
                completedBooks,
                completionRate,
                totalPagesRead
            };
        }));

        res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch genre analytics' });
    }
};

// BOOKS
exports.createBook = async (req, res) => {
    try {
        let genreInput = req.body.genre;
        if (!genreInput) {
            return res.status(400).json({ success: false, error: 'Genre is required' });
        }

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(genreInput)) {
            let existingGenre = await Genre.findOne({ name: new RegExp('^' + genreInput.trim() + '$', 'i') });
            if (!existingGenre) {
                existingGenre = await Genre.create({ name: genreInput.trim() });
            }
            req.body.genre = existingGenre._id;
        } else {
            let genreExists = await Genre.findById(genreInput);
            if (!genreExists) {
                let existingGenre = await Genre.create({ name: genreInput.trim() });
                req.body.genre = existingGenre._id;
            }
        }

        const book = await Book.create(req.body);
        res.status(201).json({ success: true, data: await book.populate('genre', 'name') });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getBooks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 0;
        const books = await Book.find()
            .populate('genre', 'name')
            .sort('-createdAt')
            .limit(limit);
        res.status(200).json({ success: true, count: books.length, data: books });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch books' });
    }
};

exports.getBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('genre', 'name');
        if (!book) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }
        res.status(200).json({ success: true, data: book });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch book' });
    }
};

exports.updateBookProgress = async (req, res) => {
    try {
        const { currentPage, pagesRead, durationMinutes } = req.body;
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }

        book.currentPage = currentPage;
        if (book.currentPage >= book.totalPages) {
            book.currentPage = book.totalPages;
            if (book.status !== 'completed') {
                book.status = 'completed';
                book.completionDate = Date.now();
            }
        } else if (book.status === 'wishlist' && currentPage > 0) {
            book.status = 'reading';
        }

        await book.save();

        if (pagesRead > 0 && durationMinutes > 0) {
            await ReadingSession.create({
                book: book._id,
                pagesRead,
                durationMinutes
            });
        }

        res.status(200).json({ success: true, data: book });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
    try {
        const books = await Book.find();
        const reading = books.filter(b => b.status === 'reading').length;
        const completed = books.filter(b => b.status === 'completed').length;
        const wishlist = books.filter(b => b.status === 'wishlist').length;

        const totalPagesRead = books.reduce((sum, b) => sum + (b.currentPage || 0), 0);

        const sessions = await ReadingSession.find().sort('-date');
        let streak = 0;
        let lastDate = null;

        // Basic streak calculation
        for (const session of sessions) {
            const sessionDate = new Date(session.date).setHours(0, 0, 0, 0);
            if (!lastDate) {
                lastDate = sessionDate;
                streak = 1;
            } else {
                const diffTime = Math.abs(lastDate - sessionDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    streak++;
                    lastDate = sessionDate;
                } else if (diffDays > 1) {
                    break;
                }
            }
        }

        // overall speed
        const speedSessions = sessions.filter(s => s.durationMinutes > 0);
        let averageSpeed = 0;
        if (speedSessions.length > 0) {
            const totalPages = speedSessions.reduce((sum, s) => sum + s.pagesRead, 0);
            const totalDuration = speedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
            averageSpeed = totalDuration > 0 ? (totalPages / totalDuration).toFixed(2) : 0;
        }

        res.status(200).json({
            success: true,
            data: {
                totalBooks: books.length,
                reading,
                completed,
                wishlist,
                totalPagesRead,
                streak,
                averageSpeed
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
};

// NOTES
exports.getNotes = async (req, res) => {
    try {
        const notes = await BookNote.find({ book: req.params.bookId }).sort('-createdAt');
        res.status(200).json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createNote = async (req, res) => {
    try {
        const note = await BookNote.create({
            book: req.params.bookId,
            ...req.body
        });
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const note = await BookNote.findByIdAndDelete(req.params.noteId);
        if (!note) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// SESSIONS
exports.getSessions = async (req, res) => {
    try {
        const sessions = await ReadingSession.find({ book: req.params.bookId }).sort('-date');
        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
