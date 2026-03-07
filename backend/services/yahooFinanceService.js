const yahooFinance = require('yahoo-finance2').default;

// 10-second price cache
const priceCache = new Map();
// 10-second news cache
const newsCache = new Map();

function mapSymbol(symbol) {
    return symbol.includes('.') ? symbol : `${symbol}.NS`;
}

async function fetchStockPrice(symbol) {
    const mappedSymbol = mapSymbol(symbol);
    const now = Date.now();

    if (priceCache.has(mappedSymbol)) {
        const cached = priceCache.get(mappedSymbol);
        if (now - cached.timestamp < 10000) {
            return cached.data;
        }
    }

    try {
        const quote = await yahooFinance.quote(mappedSymbol);

        const data = {
            symbol: symbol,
            price: quote.regularMarketPrice,
            open: quote.regularMarketOpen,
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            volume: quote.regularMarketVolume,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            marketTime: quote.regularMarketTime
        };

        priceCache.set(mappedSymbol, { timestamp: now, data });
        return data;
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error.message);
        throw error;
    }
}

async function fetchNewsForSymbol(symbol) {
    const mappedSymbol = mapSymbol(symbol);
    const now = Date.now();

    if (newsCache.has(mappedSymbol)) {
        const cached = newsCache.get(mappedSymbol);
        if (now - cached.timestamp < 10000) {
            return cached.data;
        }
    }

    try {
        const result = await yahooFinance.search(mappedSymbol, { newsCount: 5 });
        const news = result.news || [];

        const mappedNews = news.map(item => ({
            title: item.title,
            publisher: item.publisher,
            link: item.link,
            publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
            relatedSymbol: symbol
        }));

        newsCache.set(mappedSymbol, { timestamp: now, data: mappedNews });
        return mappedNews;
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error.message);
        return [];
    }
}

module.exports = {
    fetchStockPrice,
    fetchNewsForSymbol
};
