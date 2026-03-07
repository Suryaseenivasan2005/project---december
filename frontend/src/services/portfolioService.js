import axios from 'axios';

// The Vite config proxies /api to http://localhost:5000
const API_BASE = '/api';

export async function fetchPortfolioLivePrices() {
    try {
        const res = await axios.get(`${API_BASE}/stocks/portfolio/live`);
        return res.data; // { SYMBOL: lastPrice, ... }
    } catch (e) {
        console.error("Error fetching live prices via MERN backend:", e);
        throw e;
    }
}

export async function fetchPortfolioNews() {
    try {
        const res = await axios.get(`${API_BASE}/news`);
        return res.data; // [ { title, publisher, link, publishedAt, relatedSymbol }, ... ]
    } catch (e) {
        console.error("Error fetching news via MERN backend:", e);
        throw e;
    }
}

export async function fetchUserPortfolio() {
    try {
        const res = await axios.get(`${API_BASE}/stocks/user/portfolio`);
        return res.data;
    } catch (e) {
        console.error("Error fetching user portfolio:", e);
        throw e;
    }
}
