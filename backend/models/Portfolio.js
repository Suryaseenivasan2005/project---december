const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    userId: { type: String, required: true, default: 'user123' }, // mock single user for now
    stocks: [{
        symbol: { type: String, required: true },
        quantity: { type: Number, required: true },
        avgPrice: { type: Number, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
