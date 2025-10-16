import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import dotenv from 'dotenv';

import scrapeRoutes from './routes/scrape.js';
import marketRoutes from './routes/market.js';
import { scrapeAllSources } from './services/scraperService.js';
import { supabase } from './services/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/market', marketRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Scheduled scraping every 4 hours
cron.schedule('0 */4 * * *', async () => {
  console.log('Running scheduled scraping at:', new Date().toISOString());
  try {
    await scrapeAllSources();
    console.log('Scheduled scraping completed successfully');
  } catch (error) {
    console.error('Scheduled scraping failed:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🇳🇬 Nigerian Market API running on port ${PORT}`);
  console.log(`Scheduled scraping: every 4 hours`);
});

export default app;