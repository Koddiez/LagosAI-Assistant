import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanPriceData } from '../services/scraperService.js';

const NNPC_URL = 'https://www.nnpcgroup.com/';

export const scrapeNNPC = async () => {
  try {
    const { data } = await axios.get(NNPC_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const marketData = [];

    // Look for fuel price information
    const fuelKeywords = ['petrol', 'fuel', 'pms', 'diesel', 'kerosene'];

    $('p, .content, .news-content').each((i, el) => {
      const text = $(el).text().trim();

      for (const keyword of fuelKeywords) {
        if (text.toLowerCase().includes(keyword)) {
          const priceMatch = text.match(/(₦[\d,]+|N[\d,]+|\d+(?:,\d{3})*\s*naira)/i);
          if (priceMatch) {
            try {
              const item = `Fuel Price (${keyword.toUpperCase()})`;
              const cleanedData = cleanPriceData(
                item,
                priceMatch[1],
                'NGN',
                'nnpcgroup.com',
                'Nigeria'
              );
              marketData.push(cleanedData);
            } catch (error) {
              console.log(`Skipping invalid fuel data from NNPC: ${text}`, error.message);
            }
          }
        }
      }
    });

    // If no data found, return empty array (NNPC site structure may vary)
    return marketData;
  } catch (error) {
    console.error('Error scraping NNPC:', error);
    throw new Error(`NNPC scraping failed: ${error.message}`);
  }
};