const express = require('express');
const router = express.Router();
const { fetchStockPrice } = require('../services/yahooFinanceService');
const Portfolio = require('../models/Portfolio');

// Fetch live stock data for a given symbol
router.get('/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const data = await fetchStockPrice(symbol);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Unable to fetch stock data" });
    }
});

// Optionally, endpoint to fetch for all stocks in portfolio at once
router.get('/portfolio/live', async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ userId: 'user123' });
        if (!portfolio || !portfolio.stocks || portfolio.stocks.length === 0) {
            return res.json({});
        }

        const symbols = portfolio.stocks.map(s => s.symbol);

        const results = await Promise.allSettled(symbols.map(sym => fetchStockPrice(sym)));

        const prices = {};
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                prices[symbols[index]] = result.value.price;
            }
        });

        res.json(prices);
    } catch (error) {
        res.status(500).json({ error: "Unable to fetch batch stock data" });
    }
});

// Seed mock portfolio if it doesn't exist (for testing)
router.post('/seed', async (req, res) => {
    try {
        let port = await Portfolio.findOne({ userId: 'user123' });
        if (!port) {
            port = new Portfolio({
                userId: 'user123',
                stocks: [
                    { symbol: "DRREDDY", quantity: 1, avgPrice: 1259.66 },
                    { symbol: "GOLDBEES", quantity: 26, avgPrice: 82.11 },
                    { symbol: "ITC", quantity: 6, avgPrice: 413.79 },
                    { symbol: "NIFTYBEES", quantity: 5, avgPrice: 266.33 },
                    { symbol: "RELIANCE", quantity: 1, avgPrice: 1259.31 },
                    { symbol: "RPOWER", quantity: 12, avgPrice: 35.02 },
                    { symbol: "SOUTHBANK", quantity: 29, avgPrice: 32.89 },
                    { symbol: "TATSILV", quantity: 14, avgPrice: 10.31 },
                    { symbol: "TMCV", quantity: 5, avgPrice: 211.30 },
                    { symbol: "TMPV", quantity: 5, avgPrice: 467.03 }
                ]
            });
            await port.save();
        }
        res.json(port);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user portfolio
router.get('/user/portfolio', async (req, res) => {
    try {
        let port = await Portfolio.findOne({ userId: 'user123' });
        res.json(port ? port.stocks : []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
