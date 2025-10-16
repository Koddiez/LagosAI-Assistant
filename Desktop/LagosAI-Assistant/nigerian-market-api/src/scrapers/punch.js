import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanPriceData } from '../services/scraperService.js';

const PUNCH_URL = 'https://punchng.com/topics/business/';

export const scrapePunch = async () => {
  try {
    const { data } = await axios.get(PUNCH_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const marketData = [];

    // Scrape business news for market data
    $('.entry-title, .post-title').each((i, el) => {
      const title = $(el).text().trim();
      const link = $(el).find('a').attr('href') || $(el).closest('a').attr('href');

      // Look for fuel prices, forex rates, etc.
      if (title.toLowerCase().includes('fuel') || title.toLowerCase().includes('petrol') ||
          title.toLowerCase().includes('diesel') || title.toLowerCase().includes('forex') ||
          title.toLowerCase().includes('dollar')) {

        // Extract prices using regex
        const priceMatch = title.match(/(₦[\d,]+|N[\d,]+|\$[\d,]+|\d+(?:,\d{3})*\s*naira)/i);
        if (priceMatch) {
          try {
            const cleanedData = cleanPriceData(
              title.split('–')[0].split(':')[0].trim(),
              priceMatch[1],
              priceMatch[1].includes('$') ? 'USD' : 'NGN',
              'punchng.com',
              'Nigeria'
            );
            marketData.push(cleanedData);
          } catch (error) {
            console.log(`Skipping invalid data from Punch: ${title}`, error.message);
          }
        }
      }
    });

    return marketData;
  } catch (error) {
    console.error('Error scraping Punch:', error);
    throw new Error(`Punch scraping failed: ${error.message}`);
  }
};