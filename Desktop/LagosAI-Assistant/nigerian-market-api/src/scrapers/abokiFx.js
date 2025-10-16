import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanPriceData } from '../services/scraperService.js';

const ABOKIFX_URL = 'https://abokifx.com/';

export const scrapeAbokiFx = async () => {
  try {
    const { data } = await axios.get(ABOKIFX_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const marketData = [];

    // Scrape forex rates
    $('.rate, .currency-rate, [data-rate]').each((i, el) => {
      const currencyPair = $(el).find('.pair, .currency').text().trim();
      const rate = $(el).find('.rate-value, .price').text().trim();

      if (currencyPair && rate && (currencyPair.includes('USD') || currencyPair.includes('EUR'))) {
        try {
          const cleanedData = cleanPriceData(
            `USD/NGN Exchange Rate (${currencyPair})`,
            rate,
            'NGN',
            'abokifx.com',
            'Nigeria'
          );
          marketData.push(cleanedData);
        } catch (error) {
          console.log(`Skipping invalid data from AbokiFX: ${currencyPair}`, error.message);
        }
      }
    });

    return marketData;
  } catch (error) {
    console.error('Error scraping AbokiFX:', error);
    throw new Error(`AbokiFX scraping failed: ${error.message}`);
  }
};