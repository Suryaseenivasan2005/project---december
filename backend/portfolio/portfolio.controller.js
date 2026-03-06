const stocks = [
    { symbol: "DRREDDY", qty: 1, buyPrice: 1259.66, currentPrice: 1303.80 },
    { symbol: "GOLDBEES", qty: 26, buyPrice: 82.11, currentPrice: 130.82 },
    { symbol: "ITC", qty: 6, buyPrice: 413.79, currentPrice: 309.70 },
    { symbol: "NIFTYBEES", qty: 5, buyPrice: 266.33, currentPrice: 277.25 },
    { symbol: "RELIANCE", qty: 1, buyPrice: 1259.31, currentPrice: 1404.80 },
    { symbol: "RPOWER", qty: 12, buyPrice: 35.02, currentPrice: 22.44 },
    { symbol: "SOUTHBANK", qty: 29, buyPrice: 32.89, currentPrice: 39.81 },
    { symbol: "TATSILV", qty: 14, buyPrice: 10.31, currentPrice: 25.08 },
    { symbol: "TMCV", qty: 5, buyPrice: 211.30, currentPrice: 474.25 },
    { symbol: "TMPV", qty: 5, buyPrice: 467.03, currentPrice: 350.75 }
];

const mutualFunds = [
    { name: "HDFC Large Cap Fund", invested: 3000, currentValue: 3794 },
    { name: "HDFC Mid Cap Fund", invested: 3299, currentValue: 2798 }
];

const getStocks = async (req, res) => {
    try {
        res.status(200).json({ success: true, count: stocks.length, data: stocks });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

const getMutualFunds = async (req, res) => {
    try {
        res.status(200).json({ success: true, count: mutualFunds.length, data: mutualFunds });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = {
    getStocks,
    getMutualFunds
};
