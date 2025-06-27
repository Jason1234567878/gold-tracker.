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
    return parseFloat($('[data-test="instrument-price-last"]').text().replace(',', ''));
  } catch (e) {
    console.error('Gold spot scrape error:', e.message);
    return null;
  }
}

async function fetchGoldFutures() {
  try {
    const { data } = await axios.get('https://www.investing.com/commodities/gold-futures', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    // Adjust selector as needed
    return parseFloat($('[data-test="instrument-price-last"]').text().replace(',', ''));
  } catch (e) {
    console.error('Gold futures scrape error:', e.message);
    return null;
  }
}

async function fetchDXY() {
  try {
    const { data } = await axios.get('https://www.investing.com/indices/usdollar', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    return parseFloat($('[data-test="instrument-price-last"]').text().replace(',', ''));
  } catch (e) {
    console.error('DXY scrape error:', e.message);
    return null;
  }
}

cron.schedule('*/2 * * * *', async () => {
  prices.goldSpot.price = await fetchGoldSpot();
  prices.goldFutures.price = await fetchGoldFutures();
  prices.dxy.price = await fetchDXY();

  prices.goldSpot.lastUpdated = new Date();
  prices.goldFutures.lastUpdated = new Date();
  prices.dxy.lastUpdated = new Date();

  console.log(`Prices updated at ${new Date().toLocaleTimeString()}`);
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
