const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache all three assets
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
    return parseFloat($('[data-test="instrument-price-last"]').first().text().replace(',', ''));
  } catch (error) {
    console.error('Gold spot scrape failed:', error.message);
    return null;
  }
}

// 2. Gold Futures (from table)
async function fetchGoldFutures() {
  try {
    const { data } = await axios.get('https://www.investing.com/commodities/gold-futures', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const priceText = $('[data-test="instrument-price-last"]').first().text().replace(',', '').trim();
    return parseFloat(priceText);
  } catch (error) {
    console.error('Gold futures scrape failed:', error.message);
    return null;
  }
}

// 3. DXY (USD Index)
async function fetchDXY() {
  try {
    const { data } = await axios.get('https://www.investing.com/indices/usdollar', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    return parseFloat($('[data-test="instrument-price-last"]').first().text());
  } catch (error) {
    console.error('DXY scrape failed:', error.message);
    return null;
  }
}

// 🔁 Update prices every 2 minutes
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

// 🔌 Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Gold Tracker API</h1>
    <p>Gold Spot: $${prices.goldSpot.price || 'Loading...'}</p>
    <p>Gold Futures: $${prices.goldFutures.price || 'Loading...'}</p>
    <p>DXY Index: ${prices.dxy.price || 'Loading...'}</p>
  `);
});

app.get('/api/gold-spot', (req, res) => res.json(prices.goldSpot));
app.get('/api/gold-futures', (req, res) => res.json(prices.goldFutures));
app.get('/api/dxy', (req, res) => res.json(prices.dxy));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
