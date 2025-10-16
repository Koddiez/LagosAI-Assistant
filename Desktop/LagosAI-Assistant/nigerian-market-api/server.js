import express from 'express';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Example Scraper (replace with real Nigerian price source later)
async function scrapeMarketData() {
  const fakeData = [
    { item_name: 'Tomatoes', price: 1200, location: 'Lagos', last_updated: new Date() },
    { item_name: 'Rice (50kg)', price: 52000, location: 'Abuja', last_updated: new Date() },
  ];
  return fakeData;
}

app.get('/api/scrape', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.SCRAPER_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const data = await scrapeMarketData();
  for (const item of data) {
    await supabase.from('market_data').upsert(item);
  }

  res.json({ message: 'Market data updated successfully', data });
});

app.listen(PORT, () => console.log(`✅ Scraper API running on port ${PORT}`));