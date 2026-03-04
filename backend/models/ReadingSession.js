const mongoose = require('mongoose');

const readingSessionSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    pagesRead: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

readingSessionSchema.virtual('speed').get(function () {
    if (this.durationMinutes === 0) return 0;
    return this.pagesRead / this.durationMinutes;
});

readingSessionSchema.set('toJSON', { virtuals: true });
readingSessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ReadingSession', readingSessionSchema);
