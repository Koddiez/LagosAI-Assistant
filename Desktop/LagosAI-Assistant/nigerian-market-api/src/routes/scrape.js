import express from 'express';
import { authenticateApiKey } from '../middleware/auth.js';
import { scrapeAllSources, scrapeSource } from '../services/scraperService.js';

const router = express.Router();

// Apply authentication to all scrape routes
router.use(authenticateApiKey);

// POST /api/scrape - Trigger scraping from all sources
router.post('/', async (req, res) => {
  try {
    console.log('Manual scraping triggered via API');
    const result = await scrapeAllSources();

    res.json({
      success: true,
      message: 'Scraping completed',
      data: result
    });
  } catch (error) {
    console.error('API scraping error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Scraping failed',
        details: error.message
      }
    });
  }
});

// POST /api/scrape/:source - Trigger scraping from specific source
router.post('/:source', async (req, res) => {
  try {
    const { source } = req.params;
    console.log(`Manual scraping triggered for source: ${source}`);

    const result = await scrapeSource(source);

    res.json({
      success: true,
      message: `Scraping completed for ${source}`,
      data: result
    });
  } catch (error) {
    console.error(`API scraping error for ${req.params.source}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Scraping failed for ${req.params.source}`,
        details: error.message
      }
    });
  }
});

// GET /api/scrape/status - Get scraping status (could be extended for monitoring)
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    message: 'Scraper service is running',
    availableSources: [
      'Nairametrics',
      'Punch',
      'AbokiFX',
      'NNPC',
      'Jumia'
    ],
    lastScheduledRun: 'Check logs for details'
  });
});

export default router;