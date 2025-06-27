const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Store all prices in memory
let prices = {
  goldSpot: { price: null, lastUpdated: null },
  goldFutures: { price: null, lastUpdated: null },
  dxy: { price: null, lastUpdated: null }
};

// 1. Gold Spot (XAU/USD)
async function fetchGoldSpot() {
  try {
    const { data } = await axios.get('https://www.investing.com/commodities/gold', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const priceText = $('[data-test="instrument-price-last"]').first().text().replace(',', '');
    return parseFloat(priceText);
  } catch (error) {
    console.error('Gold Spot Error:', error.message);
    return null;
  }
}

// 2. Gold Futures (dedicated page)
async function fetchGoldFutures() {
  try {
    const { data } = await axios.get('https://www.investing.com/commodities/gold-futures', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const priceText = $('[data-test="instrument-price-last"]').first().text().replace(',', '');
    return parseFloat(priceText);
  } catch (error) {
    console.error('Gold Futures Error:', error.message);
    return null;
  }
}

// 3. DXY Index
async function fetchDXY() {
  try {
    const { data } = await axios.get('https://www.investing.com/indices/usdollar', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const priceText = $('[data-test="instrument-price-last"]').first().text().replace(',', '');
    return parseFloat(priceText);
  } catch (error) {
    console.error('DXY Error:', error.message);
    return null;
  }
}

// Refresh all prices every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  prices.goldSpot.price = await fetchGoldSpot();
  prices.goldFutures.price = await fetchGoldFutures();
  prices.dxy.price = await fetchDXY();

  const now = new Date();
  prices.goldSpot.lastUpdated = now;
  prices.goldFutures.lastUpdated = now;
  prices.dxy.lastUpdated = now;

  console.log(`Prices updated at ${now.toLocaleTimeString()}`);
}, { runOnInit: true });

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Gold Tracker API</h1>
    <p><strong>Gold Spot:</strong> $${prices.goldSpot.price || 'Loading...'}</p>
    <p><strong>Gold Futures:</strong> $${prices.goldFutures.price || 'Loading...'}</p>
    <p><strong>DXY Index:</strong> ${prices.dxy.price || 'Loading...'}</p>
  `);
});

app.get('/api/gold-spot', (req, res) => res.json(prices.goldSpot));
app.get('/api/gold-futures', (req, res) => res.json(prices.goldFutures));
app.get('/api/dxy', (req, res) => res.json(prices.dxy));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
