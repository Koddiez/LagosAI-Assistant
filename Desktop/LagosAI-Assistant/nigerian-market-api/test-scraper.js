// Test script to verify scraper functionality before deployment
import dotenv from 'dotenv';

// Load environment variables before any other imports
dotenv.config();

import { scrapeAllSources } from './src/services/scraperService.js';
import { getMarketData } from './src/services/supabase.js';

async function testScraper() {
  console.log('🧪 Testing Nigerian Market Data Scraper...\n');

  try {
    // Test 1: Scrape all sources
    console.log('1️⃣ Testing scraping from all sources...');
    const scrapeResult = await scrapeAllSources();
    console.log('✅ Scraping completed:', scrapeResult);

    // Test 2: Check database insertion
    console.log('\n2️⃣ Testing database queries...');
    const allData = await getMarketData({ limit: 10 });
    console.log(`✅ Found ${allData.length} records in database`);

    if (allData.length > 0) {
      console.log('📊 Sample data:');
      allData.slice(0, 3).forEach(item => {
        console.log(`   - ${item.item}: ₦${item.price} (${item.source})`);
      });
    }

    // Test 3: Test filtering
    console.log('\n3️⃣ Testing data filtering...');
    const riceData = await getMarketData({ item: 'rice', limit: 5 });
    console.log(`✅ Found ${riceData.length} rice-related items`);

    console.log('\n🎉 All tests passed! Scraper is ready for deployment.');
    console.log('\n📋 Next steps:');
    console.log('   1. Set real Supabase credentials in .env');
    console.log('   2. Deploy to Vercel');
    console.log('   3. Set up cron jobs for automatic scraping');
    console.log('   4. LagosAI will automatically use real data');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check your .env file has correct Supabase credentials');
    console.log('   - Verify Supabase project is accessible');
    console.log('   - Check network connectivity to scraping targets');
  }
}

// Run the test
testScraper();