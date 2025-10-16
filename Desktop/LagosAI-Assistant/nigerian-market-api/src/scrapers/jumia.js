import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanPriceData } from '../services/scraperService.js';

const JUMIA_FOOD_URL = 'https://jumia.com.ng/groceries/';

export const scrapeJumia = async () => {
  try {
    const { data } = await axios.get(JUMIA_FOOD_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const marketData = [];

    // Scrape product prices from Jumia grocery section
    $('.item, .product, [data-item]').each((i, el) => {
      const name = $(el).find('.name, .title, h3').text().trim();
      const price = $(el).find('.price, .sale-price, .current-price').text().trim();

      if (name && price) {
        // Focus on staple foods
        const stapleFoods = ['rice', 'beans', 'garri', 'maize', 'palm oil', 'tomato', 'onion'];
        const nameLower = name.toLowerCase();

        const isStaple = stapleFoods.some(food => nameLower.includes(food));

        if (isStaple) {
          try {
            const cleanedData = cleanPriceData(
              name,
              price,
              'NGN',
              'jumia.com.ng',
              'Nigeria'
            );
            marketData.push(cleanedData);
          } catch (error) {
            console.log(`Skipping invalid data from Jumia: ${name}`, error.message);
          }
        }
      }
    });

    return marketData;
  } catch (error) {
    console.error('Error scraping Jumia:', error);
    throw new Error(`Jumia scraping failed: ${error.message}`);
  }
};