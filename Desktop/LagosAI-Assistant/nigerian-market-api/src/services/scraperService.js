import { insertMarketData } from './supabase.js';
import { scrapeNairametrics } from '../scrapers/nairametrics.js';
import { scrapePunch } from '../scrapers/punch.js';
import { scrapeAbokiFx } from '../scrapers/abokiFx.js';
import { scrapeNNPC } from '../scrapers/nnpc.js';
import { scrapeJumia } from '../scrapers/jumia.js';

// List of all scraper functions
const scrapers = [
  { name: 'Nairametrics', func: scrapeNairametrics },
  { name: 'Punch', func: scrapePunch },
  { name: 'AbokiFX', func: scrapeAbokiFx },
  { name: 'NNPC', func: scrapeNNPC },
  { name: 'Jumia', func: scrapeJumia }
];

// Main function to scrape all sources
export const scrapeAllSources = async () => {
  console.log('Starting scraping from all sources...');
  const allData = [];
  const errors = [];

  for (const scraper of scrapers) {
    try {
      console.log(`Scraping ${scraper.name}...`);
      const data = await scraper.func();
      if (data && data.length > 0) {
        allData.push(...data);
        console.log(`✅ ${scraper.name}: ${data.length} items scraped`);
      } else {
        console.log(`⚠️ ${scraper.name}: No data scraped`);
      }
    } catch (error) {
      console.error(`❌ Error scraping ${scraper.name}:`, error.message);
      errors.push({ source: scraper.name, error: error.message });
    }
  }

  if (allData.length > 0) {
    try {
      await insertMarketData(allData);
      console.log(`✅ Total: ${allData.length} items inserted into database`);
    } catch (error) {
      console.error('❌ Error inserting data into database:', error);
      throw error;
    }
  } else {
    console.log('⚠️ No data was scraped from any source');
  }

  return {
    success: true,
    totalScraped: allData.length,
    errors: errors
  };
};

// Function to scrape specific source
export const scrapeSource = async (sourceName) => {
  const scraper = scrapers.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
  if (!scraper) {
    throw new Error(`Scraper for ${sourceName} not found`);
  }

  console.log(`Scraping ${scraper.name}...`);
  const data = await scraper.func();

  if (data && data.length > 0) {
    await insertMarketData(data);
    console.log(`✅ ${scraper.name}: ${data.length} items inserted`);
    return { success: true, count: data.length };
  } else {
    return { success: false, count: 0 };
  }
};

// Helper function to clean and validate price data
export const cleanPriceData = (item, price, currency = 'NGN', source, location = 'Nigeria') => {
  if (!item || !price || !source) {
    throw new Error('Missing required fields: item, price, source');
  }

  // Clean price: remove commas, currency symbols, and extract numeric value
  const cleanPrice = parseFloat(
    price.toString()
      .replace(/,/g, '')
      .replace(/₦|NGN|N|USD|\$/g, '')
      .trim()
  );

  if (isNaN(cleanPrice) || cleanPrice <= 0) {
    throw new Error(`Invalid price: ${price}`);
  }

  return {
    item: item.trim(),
    price: cleanPrice,
    currency: currency.toUpperCase(),
    source: source.trim(),
    location: location.trim(),
    updated_at: new Date().toISOString()
  };
};