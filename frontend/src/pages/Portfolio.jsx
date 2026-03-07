import { useState, useMemo, useEffect, useCallback } from 'react';
import { fetchPortfolioLivePrices, fetchPortfolioNews, fetchUserPortfolio } from '../services/portfolioService';
import PortfolioTable from '../components/PortfolioTable';
import NewsTab from '../components/NewsTab';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line,
} from 'recharts';

// ─── Hardcoded Data ───────────────────────────────────────────────────────────

const RAW_STOCKS = [
    { symbol: 'DRREDDY', name: "Dr. Reddy's Labs", qty: 1, buyPrice: 1259.66, currentPrice: 1303.80, sector: 'Pharma' },
    { symbol: 'GOLDBEES', name: 'Nippon Gold BeES', qty: 26, buyPrice: 82.11, currentPrice: 130.82, sector: 'ETF' },
    { symbol: 'ITC', name: 'ITC Limited', qty: 6, buyPrice: 413.79, currentPrice: 309.70, sector: 'FMCG' },
    { symbol: 'NIFTYBEES', name: 'Nippon Nifty BeES', qty: 5, buyPrice: 266.33, currentPrice: 277.25, sector: 'ETF' },
    { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 1, buyPrice: 1259.31, currentPrice: 1404.80, sector: 'Energy' },
    { symbol: 'RPOWER', name: 'Reliance Power', qty: 12, buyPrice: 35.02, currentPrice: 22.44, sector: 'Power' },
    { symbol: 'SOUTHBANK', name: 'South Indian Bank', qty: 29, buyPrice: 32.89, currentPrice: 39.81, sector: 'Banking' },
    { symbol: 'TATSILV', name: 'Tata Silver ETF', qty: 14, buyPrice: 10.31, currentPrice: 25.08, sector: 'Metals' },
    { symbol: 'TMCV', name: 'Tata Motor CV ETF', qty: 5, buyPrice: 211.30, currentPrice: 474.25, sector: 'Auto' },
    { symbol: 'TMPV', name: 'Tata Motor PV ETF', qty: 5, buyPrice: 467.03, currentPrice: 350.75, sector: 'Auto' },
];

// Symbols list used for live price & news API calls
const PORTFOLIO_SYMBOLS = RAW_STOCKS.map(s => s.symbol);

const RAW_MF = [
    {
        name: 'HDFC Large Cap Fund',
        type: 'Large Cap',
        plan: 'Regular Growth',
        sipStatus: 'Active SIP',
        invested: 3000,
        currentValue: 3794,
        xirr: 18.4,
    },
    {
        name: 'HDFC Mid Cap Fund',
        type: 'Mid Cap',
        plan: 'Regular Growth',
        sipStatus: 'Active SIP',
        invested: 3299,
        currentValue: 2798,
        xirr: -8.2,
    },
];

// ─── Computed Data ────────────────────────────────────────────────────────────

function computeStock(s) {
    const investment = +(s.qty * s.buyPrice).toFixed(2);
    const currentValue = +(s.qty * s.currentPrice).toFixed(2);
    const profitLoss = +(currentValue - investment).toFixed(2);
    const profitPct = +((profitLoss / investment) * 100).toFixed(2);
    return { ...s, investment, currentValue, profitLoss, profitPct };
}

function computeMF(m) {
    const returns = +(m.currentValue - m.invested).toFixed(2);
    const returnsPct = +((returns / m.invested) * 100).toFixed(2);
    return { ...m, returns, returnsPct };
}

const STOCKS = RAW_STOCKS.map(computeStock);
const MFS = RAW_MF.map(computeMF);

// ─── Formatters ───────────────────────────────────────────────────────────────

const inr = (v) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 2,
    }).format(v);

const pct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

// ─── Colors ───────────────────────────────────────────────────────────────────

const CHART_COLORS = [
    '#6366f1', '#22d3a5', '#f59e0b', '#a855f7',
    '#06b6d4', '#f43f5e', '#3b82f6', '#ec4899', '#10b981', '#fb923c',
];

const PROFIT_COLOR = '#22d3a5';
const LOSS_COLOR = '#f43f5e';
const ACCENT = '#6366f1';

// ─── Shared Styles ────────────────────────────────────────────────────────────

const card = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    overflow: 'hidden',
};

const tooltipStyle = {
    contentStyle: {
        background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, color: '#f0f2ff', fontSize: '0.8rem',
    },
    itemStyle: { color: '#f0f2ff' },
    cursor: { fill: 'rgba(255,255,255,0.04)' },
};

// ─── PortfolioSummaryCard ─────────────────────────────────────────────────────

function PortfolioSummaryCard({ onAnalyze, mode }) {
    const equityInvested = STOCKS.reduce((a, s) => a + s.investment, 0);
    const equityCurrent = STOCKS.reduce((a, s) => a + s.currentValue, 0);
    const equityPL = equityCurrent - equityInvested;
    const equityPLPct = (equityPL / equityInvested) * 100;

    const mfInvested = MFS.reduce((a, m) => a + m.invested, 0);
    const mfCurrent = MFS.reduce((a, m) => a + m.currentValue, 0);
    const mfReturns = mfCurrent - mfInvested;
    const mfReturnsPct = (mfReturns / mfInvested) * 100;

    const invested = mode === 'mf' ? mfInvested : equityInvested;
    const current = mode === 'mf' ? mfCurrent : equityCurrent;
    const pl = mode === 'mf' ? mfReturns : equityPL;
    const plPct = mode === 'mf' ? mfReturnsPct : equityPLPct;
    const todayChange = mode === 'mf' ? -5 : -129.05;
    const todayPct = mode === 'mf' ? -0.14 : -0.84;
    const plPos = pl >= 0;
    const todayPos = todayChange >= 0;
    const totalMfXIRR = 5.7;

    return (
        <div style={{
            ...card,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(10,15,30,0.95) 60%)',
            border: '1px solid rgba(99,102,241,0.25)',
            padding: '24px',
            marginBottom: '20px',
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, #6366f1, #a855f7, #06b6d4)',
                borderRadius: '14px 14px 0 0',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        {mode === 'mf' ? 'Mutual Fund Portfolio' : 'Equity Portfolio'}
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#f0f2ff', lineHeight: 1 }}>
                        {inr(current)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Portfolio Value</div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={onAnalyze} style={{
                        padding: '9px 18px', borderRadius: '8px', fontSize: '0.78rem',
                        fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff', border: 'none',
                        boxShadow: '0 0 18px rgba(99,102,241,0.35)',
                        letterSpacing: '0.06em', transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(99,102,241,0.55)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 18px rgba(99,102,241,0.35)'; }}
                    >
                        📊 ANALYZE
                    </button>
                    {mode !== 'mf' && (
                        <button style={{
                            padding: '9px 18px', borderRadius: '8px', fontSize: '0.78rem',
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            background: 'transparent', color: '#f0f2ff',
                            border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '0.06em',
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#818cf8'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#f0f2ff'; }}
                        >
                            ✅ VERIFY TO SELL
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invested</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: '#f0f2ff' }}>{inr(invested)}</div>
                </div>

                <div style={{ background: plPos ? 'rgba(34,211,165,0.07)' : 'rgba(244,63,94,0.07)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${plPos ? 'rgba(34,211,165,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall {plPos ? 'Gain' : 'Loss'}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: plPos ? PROFIT_COLOR : LOSS_COLOR }}>{pl >= 0 ? '+' : ''}{inr(pl)}</div>
                    <div style={{ fontSize: '0.75rem', color: plPos ? PROFIT_COLOR : LOSS_COLOR, opacity: 0.85, marginTop: 2 }}>{pct(plPct)}</div>
                </div>

                <div style={{ background: todayPos ? 'rgba(34,211,165,0.07)' : 'rgba(244,63,94,0.07)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${todayPos ? 'rgba(34,211,165,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Change</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: todayPos ? PROFIT_COLOR : LOSS_COLOR }}>{todayChange >= 0 ? '+' : ''}{inr(todayChange)}</div>
                    <div style={{ fontSize: '0.75rem', color: todayPos ? PROFIT_COLOR : LOSS_COLOR, opacity: 0.85, marginTop: 2 }}>{pct(todayPct)}</div>
                </div>

                <div style={{ background: 'rgba(168,85,247,0.07)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{mode === 'mf' ? 'XIRR' : 'Holdings'}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: '#a855f7' }}>{mode === 'mf' ? pct(totalMfXIRR) : STOCKS.length}</div>
                    {mode !== 'mf' && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Stocks</div>}
                </div>
            </div>
        </div>
    );
}

// ─── StockHoldingCard ─────────────────────────────────────────────────────────

function StockHoldingCard({ stock, livePrice }) {
    // Override with live price if available
    const ltp = livePrice != null ? livePrice : stock.currentPrice;
    const investment = +(stock.qty * stock.buyPrice).toFixed(2);
    const currentValue = +(stock.qty * ltp).toFixed(2);
    const profitLoss = +(currentValue - investment).toFixed(2);
    const profitPct = +((profitLoss / investment) * 100).toFixed(2);
    const isProfit = profitLoss >= 0;
    const plColor = isProfit ? PROFIT_COLOR : LOSS_COLOR;
    const isLive = livePrice != null;

    return (
        <div
            style={{
                ...card, padding: '0', marginBottom: '10px',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: '3px', background: plColor, flexShrink: 0, borderRadius: '14px 0 0 14px' }} />
                <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                    <div style={{ minWidth: 140, flex: '1.5' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f2ff', fontFamily: 'Space Grotesk', marginBottom: 2 }}>{stock.symbol}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>{stock.name}</div>
                        <span style={{
                            display: 'inline-block', fontSize: '0.68rem', fontWeight: 600,
                            padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)',
                            border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8',
                        }}>Qty: {stock.qty}</span>
                    </div>

                    <div style={{ minWidth: 110, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg. Price</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f2ff' }}>{inr(stock.buyPrice)}</div>
                    </div>

                    <div style={{ minWidth: 110, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            LTP {isLive && <span style={{ color: '#22d3a5', fontSize: '0.6rem', marginLeft: 4 }}>● LIVE</span>}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isLive ? '#22d3a5' : '#f0f2ff' }}>{inr(ltp)}</div>
                    </div>

                    <div style={{ width: '1px', height: 40, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                    <div style={{ minWidth: 120, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invested</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f2ff' }}>{inr(investment)}</div>
                    </div>

                    <div style={{ minWidth: 120, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Curr. Value</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f2ff' }}>{inr(currentValue)}</div>
                    </div>

                    <div style={{ width: '1px', height: 40, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                    <div style={{ minWidth: 130, textAlign: 'right', flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>P&amp;L</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: plColor, fontFamily: 'Space Grotesk' }}>
                            {profitLoss >= 0 ? '+' : ''}{inr(profitLoss)}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: plColor, opacity: 0.85 }}>{pct(profitPct)}</div>
                    </div>

                </div>
            </div>
        </div>
    );
}
// ─── MutualFundCard ───────────────────────────────────────────────────────────

function MutualFundCard({ fund }) {
    const isProfit = fund.returns >= 0;
    const plColor = isProfit ? PROFIT_COLOR : LOSS_COLOR;

    return (
        <div
            style={{
                ...card, padding: '0', marginBottom: '10px',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: '3px', background: plColor, flexShrink: 0, borderRadius: '14px 0 0 14px' }} />
                <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                    <div style={{ minWidth: 200, flex: '2' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f2ff', fontFamily: 'Space Grotesk', marginBottom: 4 }}>{fund.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7' }}>{fund.type}</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', color: '#22d3a5' }}>{fund.sipStatus}</span>
                        </div>
                    </div>

                    <div style={{ minWidth: 110, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invested</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f2ff' }}>{inr(fund.invested)}</div>
                    </div>

                    <div style={{ minWidth: 120, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Curr. Value</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f2ff' }}>{inr(fund.currentValue)}</div>
                    </div>

                    <div style={{ width: '1px', height: 40, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                    <div style={{ minWidth: 130, textAlign: 'right', flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Returns</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: plColor, fontFamily: 'Space Grotesk' }}>{fund.returns >= 0 ? '+' : ''}{inr(fund.returns)}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: plColor, opacity: 0.85 }}>{pct(fund.returnsPct)}</div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ─── PortfolioAnalyticsModal ──────────────────────────────────────────────────

function PortfolioAnalyticsModal({ onClose, mode }) {
    const [chartTab, setChartTab] = useState('sector');

    const sectorData = useMemo(() => {
        const map = {};
        STOCKS.forEach(s => { map[s.sector] = (map[s.sector] || 0) + s.investment; });
        return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
    }, []);

    const mfAllocationData = MFS.map(m => ({ name: m.name.replace('HDFC ', ''), value: m.invested }));
    const barData = STOCKS.map(s => ({ name: s.symbol, Invested: +s.investment.toFixed(0), 'Curr. Value': +s.currentValue.toFixed(0) }));
    const mfBarData = MFS.map(m => ({ name: m.name.replace('HDFC ', ''), Invested: m.invested, 'Curr. Value': m.currentValue }));
    const distData = STOCKS.map(s => ({ name: s.symbol, value: +s.currentValue.toFixed(2) }));

    const lineData = [
        { month: 'Sep', value: 11200 }, { month: 'Oct', value: 12400 },
        { month: 'Nov', value: 11800 }, { month: 'Dec', value: 13200 },
        { month: 'Jan', value: 13800 }, { month: 'Feb', value: 14500 },
        { month: 'Mar', value: 15254 },
    ];
    const mfLineData = [
        { month: 'Sep', value: 5100 }, { month: 'Oct', value: 5600 },
        { month: 'Nov', value: 5800 }, { month: 'Dec', value: 6100 },
        { month: 'Jan', value: 6300 }, { month: 'Feb', value: 6450 },
        { month: 'Mar', value: 6592 },
    ];

    const chartTabs = mode === 'mf'
        ? ['allocation', 'returns', 'growth']
        : ['sector', 'comparison', 'distribution', 'growth'];

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
        >
            <div style={{
                ...card,
                width: '100%', maxWidth: 860, maxHeight: '92vh', overflowY: 'auto',
                background: '#0a0f1e', border: '1px solid rgba(99,102,241,0.3)', position: 'relative',
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                    position: 'sticky', top: 0, background: '#0a0f1e', zIndex: 10,
                }}>
                    <div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.15rem', color: '#f0f2ff' }}>📊 Portfolio Analytics</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{mode === 'mf' ? 'Mutual Fund' : 'Equity'} · Hardcoded Data</div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f0f2ff', borderRadius: 8, width: 34, height: 34,
                            cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >✕</button>
                </div>

                <div style={{ display: 'flex', gap: 6, padding: '16px 24px 0', flexWrap: 'wrap' }}>
                    {chartTabs.map(t => (
                        <button key={t} onClick={() => setChartTab(t)} style={{
                            padding: '7px 16px', borderRadius: 24, fontSize: '0.75rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                            background: chartTab === t ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                            color: chartTab === t ? '#818cf8' : 'rgba(255,255,255,0.45)',
                            border: chartTab === t ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                            transition: 'all 0.2s',
                        }}>{t}</button>
                    ))}
                </div>

                <div style={{ padding: '20px 24px 28px' }}>
                    {chartTab === 'sector' && (
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>Sector Allocation — by invested amount</div>
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart>
                                    <Pie data={sectorData} cx="50%" cy="50%" outerRadius={130} innerRadius={60} dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                                        {sectorData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                    <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {chartTab === 'comparison' && (
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>Invested vs Current Value — per stock</div>
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={barData} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                                    <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                    <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }} />
                                    <Bar dataKey="Invested" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Curr. Value" fill="#22d3a5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {chartTab === 'distribution' && (
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>Portfolio Distribution — % of current value</div>
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart>
                                    <Pie data={distData} cx="50%" cy="50%" outerRadius={130} innerRadius={60} dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                        labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                                        {distData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                    <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {chartTab === 'growth' && (
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>Portfolio Growth — Simulated (Sep 2025 – Mar 2026)</div>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={mode === 'mf' ? mfLineData : lineData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                    <Line type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {chartTab === 'allocation' && (
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>Fund Allocation — by invested amount</div>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={mfAllocationData} cx="50%" cy="50%" outerRadius={120} innerRadius={55} dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                                        {mfAllocationData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                    <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {chartTab === 'returns' && (
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>Invested vs Current Value — per fund</div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={mfBarData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                                    <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                    <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }} />
                                    <Bar dataKey="Invested" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Curr. Value" fill="#22d3a5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
    const equityInvested = STOCKS.reduce((a, s) => a + s.investment, 0);
    const equityCurrent = STOCKS.reduce((a, s) => a + s.currentValue, 0);
    const mfInvested = MFS.reduce((a, m) => a + m.invested, 0);
    const mfCurrent = MFS.reduce((a, m) => a + m.currentValue, 0);
    const totalInvested = equityInvested + mfInvested;
    const totalCurrent = equityCurrent + mfCurrent;
    const totalPL = totalCurrent - totalInvested;
    const totalPLPct = (totalPL / totalInvested) * 100;

    const overviewData = [
        { name: 'Equity', invested: +equityInvested.toFixed(0), current: +equityCurrent.toFixed(0) },
        { name: 'Mutual Funds', invested: +mfInvested.toFixed(0), current: +mfCurrent.toFixed(0) },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Top Banner ── */}
            <div style={{
                ...card,
                padding: '32px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(10,15,30,0.98) 70%)',
                border: '1px solid rgba(99,102,241,0.3)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #6366f1, #a855f7, #22d3a5)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Net Portfolio Value</div>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '3.2rem', fontWeight: 800, color: '#f0f2ff', lineHeight: 1, marginBottom: 12 }}>{inr(totalCurrent)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>TOTAL INVESTED</span>
                                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f2ff' }}>{inr(totalInvested)}</span>
                            </div>
                            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>NET RETURNS</span>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: totalPL >= 0 ? PROFIT_COLOR : LOSS_COLOR }}>
                                    {totalPL >= 0 ? '+' : ''}{inr(totalPL)} ({pct(totalPLPct)})
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ ...card, minWidth: 160, background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>AVG MONTHLY GROWTH</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22d3a5' }}>+4.2%</div>
                        </div>
                        <div style={{ ...card, minWidth: 160, background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>PORTFOLIO HEALTH</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6366f1' }}>EXCELLENT</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2-Column Desktop Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>

                {/* Left: Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ ...card, padding: '24px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f2ff', marginBottom: 20 }}>📊 Asset Class Comparison</div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={overviewData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(1)}K`} />
                                <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '20px' }} />
                                <Bar dataKey="invested" name="Principal" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                                <Bar dataKey="current" name="Market Value" fill="#22d3a5" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ ...card, padding: '24px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f2ff', marginBottom: 20 }}>📈 Cumulative Portfolio Value</div>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={[
                                { month: 'Oct', value: 12400 }, { month: 'Nov', value: 11800 },
                                { month: 'Dec', value: 13200 }, { month: 'Jan', value: 13800 },
                                { month: 'Feb', value: 14500 }, { month: 'Mar', value: 21846 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                                <Tooltip {...tooltipStyle} formatter={v => inr(v)} />
                                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Segment Cards + Tip */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { label: 'EQUITY HOLDINGS', inv: equityInvested, cur: equityCurrent, icon: '📈', count: STOCKS.length },
                        { label: 'MUTUAL FUNDS', inv: mfInvested, cur: mfCurrent, icon: '🏦', count: MFS.length },
                    ].map(seg => {
                        const pl = seg.cur - seg.inv;
                        const pos = pl >= 0;
                        return (
                            <div key={seg.label} style={{ ...card, padding: '24px', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                <div style={{ position: 'absolute', right: 20, top: 24, fontSize: '1.5rem', opacity: 0.18 }}>{seg.icon}</div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 16 }}>{seg.label}</div>
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff', fontFamily: 'Space Grotesk' }}>{inr(seg.cur)}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: pos ? PROFIT_COLOR : LOSS_COLOR, marginTop: 4 }}>
                                        {pos ? '▲' : '▼'} {inr(pl)} ({pct((pl / seg.inv) * 100)})
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 24, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>INVESTED</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f2ff' }}>{inr(seg.inv)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>HOLDINGS</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f2ff' }}>{seg.count}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div style={{ ...card, padding: '24px', background: 'rgba(34,211,165,0.03)', border: '1px solid rgba(34,211,165,0.1)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#22d3a5', marginBottom: 8 }}>💡 Optimization Tip</div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                            Your Pharma sector is currently outperforming the market by 12%. Consider rebalancing your Energy holdings for better long-term risk management.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function Portfolio() {
    const [activeTab, setActiveTab] = useState('equity');
    const [search, setSearch] = useState('');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsMode, setAnalyticsMode] = useState('equity');

    // ── Live price state ──
    const [livePrices, setLivePrices] = useState({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [priceError, setPriceError] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // ── News state ──
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [newsError, setNewsError] = useState(null);

    const [userStocks, setUserStocks] = useState([]);

    // ── Fetch portfolio base ──
    const loadPortfolio = useCallback(async () => {
        try {
            const stocks = await fetchUserPortfolio();
            setUserStocks(stocks);
        } catch (e) {
            console.error("Error loading portfolio:", e);
        }
    }, []);

    useEffect(() => {
        loadPortfolio();
    }, [loadPortfolio]);

    // ── Fetch live prices ──
    const handleRefreshPrices = useCallback(async () => {
        setIsRefreshing(true);
        setPriceError(null);
        try {
            const prices = await fetchPortfolioLivePrices();
            setLivePrices(prices);
            setLastRefreshed(new Date());
        } catch {
            setPriceError('Unable to fetch stock prices. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // ── Fetch news ──
    const handleFetchNews = useCallback(async () => {
        if (news.length > 0) return; // already loaded
        setNewsLoading(true);
        setNewsError(null);
        try {
            const articles = await fetchPortfolioNews();
            setNews(articles);
        } catch {
            setNewsError('Unable to fetch news. Try again.');
        } finally {
            setNewsLoading(false);
        }
    }, [news.length]);

    // ── Auto-refresh every 5 minutes ──
    useEffect(() => {
        handleRefreshPrices();
        const interval = setInterval(handleRefreshPrices, 300_000);
        return () => clearInterval(interval);
    }, [handleRefreshPrices]);

    // ── Load news when News tab is opened ──
    useEffect(() => {
        if (activeTab === 'news') handleFetchNews();
    }, [activeTab, handleFetchNews]);

    const filteredStocks = useMemo(() =>
        userStocks.filter(s =>
            s.symbol.toLowerCase().includes(search.toLowerCase())
        ), [search, userStocks]);

    const filteredMFs = useMemo(() =>
        MFS.filter(m => m.name.toLowerCase().includes(search.toLowerCase())),
        [search]);

    const openAnalytics = (mode) => { setAnalyticsMode(mode); setShowAnalytics(true); };

    const TABS = [
        { key: 'overview', label: '📊 Overview' },
        { key: 'equity', label: '📈 Equity' },
        { key: 'mutualfunds', label: '🏦 Mutual Funds' },
        { key: 'news', label: '📰 News' },
    ];

    // ── shared search bar ──
    const SearchBar = ({ placeholder }) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '12px 20px', marginBottom: '20px', transition: 'all 0.2s',
        }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
            <span style={{ fontSize: '1.1rem', opacity: 0.45 }}>🔍</span>
            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f0f2ff', fontSize: '0.95rem', fontFamily: 'inherit' }}
            />
            {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
            )}
        </div>
    );

    return (
        <div className="page-content">

            {/* Page Title + Refresh Button */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff', marginBottom: 6 }}>
                        Portfolio Dashboard
                    </h1>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.35)' }}>
                        Real-time insights and asset performance management
                    </p>
                </div>

                {/* Refresh controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <button
                        onClick={handleRefreshPrices}
                        disabled={isRefreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', borderRadius: 10, fontSize: '0.82rem',
                            fontWeight: 700, cursor: isRefreshing ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', letterSpacing: '0.06em',
                            background: isRefreshing ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                            color: isRefreshing ? 'rgba(255,255,255,0.4)' : '#fff',
                            border: isRefreshing ? '1px solid rgba(99,102,241,0.2)' : 'none',
                            boxShadow: isRefreshing ? 'none' : '0 0 18px rgba(99,102,241,0.35)',
                            transition: 'all 0.2s',
                            opacity: isRefreshing ? 0.7 : 1,
                        }}
                    >
                        {isRefreshing ? (
                            <>
                                <span style={{
                                    display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                                    border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#818cf8',
                                    animation: 'spin 0.7s linear infinite',
                                }} />
                                Refreshing…
                            </>
                        ) : '🔄 Refresh Prices'}
                    </button>
                    {lastRefreshed && !isRefreshing && (
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>
                            Updated {lastRefreshed.toLocaleTimeString()}
                        </span>
                    )}
                    {priceError && (
                        <span style={{ fontSize: '0.7rem', color: '#f43f5e' }}>⚠️ {priceError}</span>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '28px' }}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setActiveTab(t.key); setSearch(''); }}
                        style={{
                            padding: '12px 24px', background: 'transparent', border: 'none',
                            borderBottom: activeTab === t.key ? '3px solid #6366f1' : '3px solid transparent',
                            color: activeTab === t.key ? '#f0f2ff' : 'rgba(255,255,255,0.38)',
                            fontWeight: activeTab === t.key ? 700 : 500,
                            fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}
                    >{t.label}</button>
                ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && <OverviewTab />}

            {/* ── EQUITY TAB ── */}
            {activeTab === 'equity' && (
                <div>
                    <PortfolioSummaryCard onAnalyze={() => openAnalytics('equity')} mode="equity" />
                    <SearchBar placeholder="Search stocks by name or symbol…" />
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
                        Showing {filteredStocks.length} of {userStocks.length} holdings
                    </div>
                    {filteredStocks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)', fontSize: '1rem' }}>
                            No holdings found matching &ldquo;{search}&rdquo;
                        </div>
                    ) : (
                        <PortfolioTable stocks={filteredStocks} livePrices={livePrices} />
                    )}
                </div>
            )}

            {/* ── MUTUAL FUNDS TAB ── */}
            {activeTab === 'mutualfunds' && (
                <div>
                    <PortfolioSummaryCard onAnalyze={() => openAnalytics('mf')} mode="mf" />
                    <SearchBar placeholder="Search mutual funds…" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filteredMFs.map(mf => <MutualFundCard key={mf.name} fund={mf} />)}
                    </div>
                </div>
            )}

            {/* ── NEWS TAB ── */}
            {activeTab === 'news' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', color: '#f0f2ff' }}>Latest News</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>News for your holdings · sorted newest first</div>
                        </div>
                        <button
                            onClick={() => { setNews([]); setTimeout(handleFetchNews, 100); }}
                            disabled={newsLoading}
                            style={{
                                padding: '8px 16px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                                cursor: newsLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                                color: '#818cf8', transition: 'all 0.2s',
                            }}
                        >🔄 Reload News</button>
                    </div>
                    <NewsTab news={news} loading={newsLoading} error={newsError} />
                </div>
            )}

            {/* Analytics Modal */}
            {showAnalytics && (
                <PortfolioAnalyticsModal onClose={() => setShowAnalytics(false)} mode={analyticsMode} />
            )}
        </div>
    );
}
