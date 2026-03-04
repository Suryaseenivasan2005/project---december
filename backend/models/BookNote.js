const mongoose = require('mongoose');

const bookNoteSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    content: { type: String, required: true },
    chapter: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BookNote', bookNoteSchema);
