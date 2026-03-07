import axios from 'axios';

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

// ─── 30-second price cache ────────────────────────────────────────────────────
const priceCache = {
    data: {},
    timestamp: null,
    TTL_MS: 30_000,
    isValid() {
        return this.timestamp && Date.now() - this.timestamp < this.TTL_MS;
    },
    set(prices) {
        this.data = prices;
        this.timestamp = Date.now();
    },
    get() {
        return this.isValid() ? this.data : null;
    },
};

/**
 * Fetch live prices for an array of symbols using the Koyeb free NSE API.
 * Returns { SYMBOL: price, ... }
 * Uses 30-second cache to avoid duplicate calls.
 */
export async function fetchLivePrices(symbols) {
    const cached = priceCache.get();
    if (cached) return cached;

    try {
        const symbolsList = symbols.join(',');
        const res = await axios.get(`/stock/list`, {
            params: { symbols: symbolsList, res: 'num' }
        });

        const prices = {};
        if (res.data && res.data.stocks) {
            res.data.stocks.forEach((stock) => {
                if (stock.last_price) {
                    prices[stock.symbol] = stock.last_price;
                }
            });
        }

        priceCache.set(prices);
        return prices;
    } catch (e) {
        console.error("Error fetching live prices:", e);
        throw e;
    }
}

/**
 * Fetch company news for a single symbol between `from` and `to` (YYYY-MM-DD).
 */
export async function fetchCompanyNews(symbol, from = '2024-01-01', to = '2025-12-31') {
    try {
        const res = await axios.get(`${BASE_URL}/company-news`, {
            params: { symbol, from, to, token: API_KEY },
        });
        return (res.data || []).map((item) => ({ ...item, stockSymbol: symbol }));
    } catch {
        return [];
    }
}

/**
 * Fetch and merge news for multiple symbols.
 * Deduplicates by headline, sorts newest first, caps at 60 articles.
 */
export async function fetchPortfolioNews(symbols) {
    const results = await Promise.allSettled(
        symbols.map((sym) => fetchCompanyNews(sym))
    );

    const seen = new Set();
    const articles = [];

    results.forEach((r) => {
        if (r.status === 'fulfilled') {
            r.value.forEach((article) => {
                if (article.id && !seen.has(article.id)) {
                    seen.add(article.id);
                    articles.push(article);
                } else if (!article.id && !seen.has(article.headline)) {
                    seen.add(article.headline);
                    articles.push(article);
                }
            });
        }
    });

    // Sort newest first
    articles.sort((a, b) => b.datetime - a.datetime);
    return articles.slice(0, 60);
}
