import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanPriceData } from '../services/scraperService.js';

const NAIRAMETRICS_URL = 'https://nairametrics.com/category/market-news/';

export const scrapeNairametrics = async () => {
  try {
    const { data } = await axios.get(NAIRAMETRICS_URL, {
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

    // Scrape article listings for market-related news
    $('article').each((i, el) => {
      const title = $(el).find('h2, h3').text().trim();
      const link = $(el).find('a').attr('href');
      const excerpt = $(el).find('.entry-excerpt, .post-excerpt').text().trim();

      // Look for price information in titles and excerpts
      const pricePatterns = [
        /₦[\d,]+(?:\.\d{2})?/g,
        /N[\d,]+(?:\.\d{2})?/g,
        /\$\d+(?:\.\d{2})?/g,
        /\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:naira|NGN|dollars|USD)/gi
      ];

      let price = null;
      let item = null;
      let currency = 'NGN';

      for (const pattern of pricePatterns) {
        const match = title.match(pattern) || excerpt.match(pattern);
        if (match) {
          const matchedText = match[0];
          if (matchedText.includes('$') || matchedText.toLowerCase().includes('usd')) {
            currency = 'USD';
          }
          price = matchedText;
          break;
        }
      }

      // Extract commodity names
      const commodityKeywords = [
        'rice', 'garri', 'maize', 'beans', 'palm oil', 'tomato', 'onion',
        'yam', 'cassava', 'cocoa', 'coffee', 'groundnut', 'sesame',
        'poultry', 'fish', 'beef', 'milk', 'eggs', 'bread', 'cement',
        'fuel', 'petrol', 'diesel', 'kerosene'
      ];

      const titleLower = title.toLowerCase();
      const foundCommodity = commodityKeywords.find(keyword =>
        titleLower.includes(keyword)
      );

      if (foundCommodity && price) {
        item = title.split('–')[0].split(':')[0].trim(); // Clean title

        try {
          const cleanedData = cleanPriceData(
            item,
            price,
            currency,
            'nairametrics.com',
            'Nigeria'
          );
          marketData.push(cleanedData);
        } catch (error) {
          console.log(`Skipping invalid data from Nairametrics: ${title}`, error.message);
        }
      }
    });

    return marketData;
  } catch (error) {
    console.error('Error scraping Nairametrics:', error);
    throw new Error(`Nairametrics scraping failed: ${error.message}`);
  }
};