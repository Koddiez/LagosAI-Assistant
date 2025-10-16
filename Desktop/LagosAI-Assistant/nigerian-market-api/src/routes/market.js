import express from 'express';
import { getMarketData } from '../services/supabase.js';

const router = express.Router();

// GET /api/market/prices - Get market prices with optional filters
router.get('/prices', async (req, res) => {
  try {
    const { item, location, source, all } = req.query;

    const filters = {
      item,
      location,
      source,
      all: all === 'true', // Include all data if true, not just last 24h
      limit: parseInt(req.query.limit) || 100
    };

    const data = await getMarketData(filters);

    res.json({
      success: true,
      data: data,
      count: data.length,
      filters: filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market data fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch market data',
        details: error.message
      }
    });
  }
});

// GET /api/market/summary - Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    // Get all recent data for summary
    const allData = await getMarketData({ all: true, limit: 1000 });

    // Group by item and get latest prices
    const itemSummary = {};
    const sourceSummary = {};

    allData.forEach(item => {
      // Item summary
      if (!itemSummary[item.item]) {
        itemSummary[item.item] = {
          item: item.item,
          count: 0,
          latest_price: item.price,
          currency: item.currency,
          latest_update: item.updated_at,
          sources: new Set()
        };
      }

      itemSummary[item.item].count += 1;
      itemSummary[item.item].sources.add(item.source);

      // Update latest price if newer
      if (new Date(item.updated_at) > new Date(itemSummary[item.item].latest_update)) {
        itemSummary[item.item].latest_price = item.price;
        itemSummary[item.item].latest_update = item.updated_at;
      }

      // Source summary
      if (!sourceSummary[item.source]) {
        sourceSummary[item.source] = { source: item.source, count: 0 };
      }
      sourceSummary[item.source].count += 1;
    });

    // Convert sets to arrays
    Object.values(itemSummary).forEach(summary => {
      summary.sources = Array.from(summary.sources);
    });

    res.json({
      success: true,
      summary: {
        total_records: allData.length,
        unique_items: Object.keys(itemSummary).length,
        sources: Object.values(sourceSummary),
        top_items: Object.values(itemSummary)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market summary error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate market summary',
        details: error.message
      }
    });
  }
});

export default router;