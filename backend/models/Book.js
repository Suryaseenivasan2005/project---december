const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    totalPages: { type: Number, required: true },
    genre: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre', required: true },
    status: { type: String, default: 'wishlist' },
    whyReading: { type: String },
    lifeImplementation: { type: String },
    rating: { type: Number, min: 1, max: 10 },
    currentPage: { type: Number, default: 0 },
    completionDate: { type: Date },
    readMonthYear: { type: String }
}, { timestamps: true });

bookSchema.virtual('progressPercentage').get(function () {
    if (this.totalPages === 0) return 0;
    return Math.round((this.currentPage / this.totalPages) * 100);
});

bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
