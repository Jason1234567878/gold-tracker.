const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

let prices = {
  goldSpot: { price: null, lastUpdated: null },
  goldFutures: { price: null, lastUpdated: null },
  dxy: { price: null, lastUpdated: null }
};

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

async function fetchGoldFutures() {
  try {
    const { data } = await axios.get('https://www.investing.com/commodities/gold', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    return parseFloat($('.dynamic-table__row:contains("Futures") .last-price-value').first().text().replace(',', ''));
  } catch (error) {
    console.error('Gold futures scrape failed:', error.message);
    return null;
  }
}

async function fetchDXY() {
  try {
    const { data } = await axios.get('https://www.investing.com/indices/usdollar', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    return parseFloat($('[data-test="instrument-price-last"]').first().text().replace(',', ''));
  } catch (error) {
    console.error('DXY scrape failed:', error.message);
    return null;
  }
}

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
Then click “Commit new file” at the bottom.

🔹 2. package.json
Now repeat and create a new file:

File name: package.json

Paste this:

json
Copy
Edit
{
  "name": "gold-tracker",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "cheerio": "^1.0.0-rc.12",
    "express": "^4.18.2",
    "node-cron": "^3.0.2"
  }
}
