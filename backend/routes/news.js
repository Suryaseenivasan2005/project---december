const express = require('express');
const router = express.Router();
const { fetchNewsForSymbol } = require('../services/yahooFinanceService');
const Portfolio = require('../models/Portfolio');

// Fetch latest news for portfolio stocks
router.get('/', async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ userId: 'user123' });
        if (!portfolio || !portfolio.stocks || portfolio.stocks.length === 0) {
            return res.json([]);
        }

        const symbols = portfolio.stocks.map(s => s.symbol);

        const results = await Promise.allSettled(symbols.map(sym => fetchNewsForSymbol(sym)));

        let allNews = [];
        results.forEach((result) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                allNews = allNews.concat(result.value);
            }
        });

        // Deduplicate
        const uniqueNews = [];
        const seenLinks = new Set();
        for (const item of allNews) {
            if (!seenLinks.has(item.link)) {
                seenLinks.add(item.link);
                uniqueNews.push(item);
            }
        }

        // Sort mostly recent first
        uniqueNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        res.json(uniqueNews.slice(0, 50));
    } catch (error) {
        res.status(500).json({ error: "Unable to fetch news data" });
    }
});

module.exports = router;
