const express = require('express');
const router = express.Router();
const { getStocks, getMutualFunds } = require('./portfolio.controller');

router.get('/stocks', getStocks);
router.get('/mutualfunds', getMutualFunds);

module.exports = router;
