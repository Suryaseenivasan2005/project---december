require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────
app.use('/api/projects', require('./routes/projects'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Jarvis API is running 🚀',
        timestamp: new Date().toISOString(),
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Jarvis Backend API',
        endpoints: {
            health: '/api/health',
            projects: '/api/projects'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ─── MongoDB + Server Start ────────────────
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected:', process.env.MONGO_URI);

        app.listen(PORT, () => {
            console.log(`🚀 Jarvis API running at http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

startServer();
