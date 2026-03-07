import React from 'react';

const inr = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);
const pct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const PROFIT_COLOR = '#22d3a5';
const LOSS_COLOR = '#f43f5e';

export default function PortfolioTable({ stocks, livePrices }) {
    let totals = { investment: 0, currentValue: 0, profitLoss: 0, todayChange: 0 };

    const renderedStocks = stocks.map(stock => {
        const livePrice = livePrices[stock.symbol];
        const ltp = livePrice != null ? livePrice : stock.avgPrice; // fallback
        const investment = stock.quantity * stock.avgPrice;
        const currentValue = stock.quantity * ltp;
        const profitLoss = currentValue - investment;
        const profitPct = investment > 0 ? (profitLoss / investment) * 100 : 0;

        // Simple mock today change since we don't store yesterday's close in this schema
        const todayChange = profitLoss * 0.1; // Placeholder for UI

        totals.investment += investment;
        totals.currentValue += currentValue;
        totals.profitLoss += profitLoss;
        totals.todayChange += todayChange;

        const isProfit = profitLoss >= 0;
        const plColor = isProfit ? PROFIT_COLOR : LOSS_COLOR;

        return (
            <tr key={stock.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px', color: '#f0f2ff', fontWeight: 600 }}>{stock.symbol}</td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{stock.quantity}</td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{inr(stock.avgPrice)}</td>
                <td style={{ padding: '16px', color: livePrice ? '#22d3a5' : '#f0f2ff', fontWeight: 600 }}>
                    {inr(ltp)} {livePrice && <span style={{ fontSize: '0.65rem', marginLeft: 6 }}>● LIVE</span>}
                </td>
                <td style={{ padding: '16px', color: todayChange >= 0 ? PROFIT_COLOR : LOSS_COLOR }}>{inr(todayChange)}</td>
                <td style={{ padding: '16px', color: '#f0f2ff' }}>{inr(currentValue)}</td>
                <td style={{ padding: '16px', color: plColor, fontWeight: 700 }}>
                    {isProfit ? '+' : ''}{inr(profitLoss)} <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: 4 }}>({pct(profitPct)})</span>
                </td>
            </tr>
        );
    });

    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '16px' }}>Symbol</th>
                        <th style={{ padding: '16px' }}>Quantity</th>
                        <th style={{ padding: '16px' }}>Avg Price</th>
                        <th style={{ padding: '16px' }}>Current Price</th>
                        <th style={{ padding: '16px' }}>Today's Change</th>
                        <th style={{ padding: '16px' }}>Total Value</th>
                        <th style={{ padding: '16px' }}>Profit/Loss</th>
                    </tr>
                </thead>
                <tbody>
                    {renderedStocks}
                </tbody>
                <tfoot>
                    <tr style={{ background: 'rgba(99,102,241,0.05)', fontWeight: 700, color: '#f0f2ff' }}>
                        <td style={{ padding: '16px' }} colSpan={4}>TOTAL</td>
                        <td style={{ padding: '16px', color: totals.todayChange >= 0 ? PROFIT_COLOR : LOSS_COLOR }}>{inr(totals.todayChange)}</td>
                        <td style={{ padding: '16px' }}>{inr(totals.currentValue)}</td>
                        <td style={{ padding: '16px', color: totals.profitLoss >= 0 ? PROFIT_COLOR : LOSS_COLOR }}>
                            {inr(totals.profitLoss)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
