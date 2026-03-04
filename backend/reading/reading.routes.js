const express = require('express');
const router = express.Router();
const {
    getGenres,
    getGenreAnalytics,
    createBook,
    getBooks,
    getBook,
    updateBookProgress,
    getDashboardStats,
    getNotes,
    createNote,
    deleteNote,
    getSessions
} = require('./reading.controller');

// Genres
router.route('/genres').get(getGenres);
router.route('/genres/analytics').get(getGenreAnalytics);

// Dashboard
router.route('/dashboard/stats').get(getDashboardStats);

// Books
router.route('/').post(createBook).get(getBooks);
router.route('/:id').get(getBook);
router.route('/:id/progress').put(updateBookProgress);

// Notes
router.route('/:bookId/notes').get(getNotes).post(createNote);
router.route('/notes/:noteId').delete(deleteNote);

// Sessions
router.route('/:bookId/sessions').get(getSessions);

module.exports = router;
