// @ts-ignore - Deno runtime types
// @ts-ignore - Supabase imports work in Deno runtime
import { createClient } from 'jsr:@supabase/supabase-js@2'

// @ts-ignore - Deno global available in runtime
console.log("Market scraper function started!")

// @ts-ignore - Deno global available in runtime
Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    // @ts-ignore - Deno global available in runtime
    const supabase = createClient(
      // @ts-ignore - Deno global available in runtime
      Deno.env.get('SUPABASE_URL')!,
      // @ts-ignore - Deno global available in runtime
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log("Running market data scraper...")

    // Simple scraper logic (adapted for Deno)
    const scrapedData: Array<{
      item: string;
      price: number;
      currency: string;
      source: string;
      location: string;
      updated_at: string;
    }> = await scrapeAllSources()

    if (scrapedData && scrapedData.length > 0) {
      // Insert data into database
      const { data, error } = await supabase
        .from('market_data')
        .insert(scrapedData)

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Database insert failed', details: error }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      }

      console.log(`Successfully scraped and inserted ${scrapedData.length} records`)
      return new Response(
        JSON.stringify({
          success: true,
          recordsInserted: scrapedData.length,
          timestamp: new Date().toISOString()
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'No data scraped' }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

  } catch (error) {
    console.error('Scraper function error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

// Simplified scraper functions for Deno
async function scrapeAllSources(): Promise<Array<{
  item: string;
  price: number;
  currency: string;
  source: string;
  location: string;
  updated_at: string;
}>> {
  const sources = [
    scrapeNairametrics,
    // Add other sources as needed
  ]

  const allData: Array<{
    item: string;
    price: number;
    currency: string;
    source: string;
    location: string;
    updated_at: string;
  }> = []

  for (const scraper of sources) {
    try {
      const data = await scraper()
      if (data && data.length > 0) {
        allData.push(...data)
      }
    } catch (error) {
      console.error(`Scraper error:`, (error as Error).message)
    }
  }

  return allData
}

async function scrapeNairametrics() {
  try {
    const response = await fetch('https://nairametrics.com/category/market-news/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    return parseNairametricsData(html)
  } catch (error) {
    console.error('Nairametrics scraping error:', error.message)
    return []
  }
}

function parseNairametricsData(html: string): Array<{
  item: string;
  price: number;
  currency: string;
  source: string;
  location: string;
  updated_at: string;
}> {
  const data: Array<{
    item: string;
    price: number;
    currency: string;
    source: string;
    location: string;
    updated_at: string;
  }> = []

  // Simple regex-based parsing (Deno doesn't have cheerio by default)
  const articleRegex = /<article[^>]*>(.*?)<\/article>/gis
  const titleRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/i
  const priceRegex = /(₦[\d,]+|N[\d,]+|\$[\d,]+|\d+(?:,\d{3})*\s*naira)/gi

  let match
  while ((match = articleRegex.exec(html)) !== null) {
    const articleContent = match[1]
    const titleMatch = articleContent.match(titleRegex)
    const priceMatch = articleContent.match(priceRegex)

    if (titleMatch && priceMatch) {
      const title = titleMatch[1].replace(/<[^>]*>/g, '').trim()
      const price = priceMatch[0]

      // Clean and validate data
      const cleanPrice = parseFloat(price.replace(/[,₦N$]/g, ''))
      if (!isNaN(cleanPrice) && cleanPrice > 0) {
        data.push({
          item: title.split('–')[0].split(':')[0].trim(),
          price: cleanPrice,
          currency: price.includes('$') ? 'USD' : 'NGN',
          source: 'nairametrics.com',
          location: 'Nigeria',
          updated_at: new Date().toISOString()
        })
      }
    }
  }

  return data
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/scrape_market' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
