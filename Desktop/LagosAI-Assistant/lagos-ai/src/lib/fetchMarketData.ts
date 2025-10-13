export async function fetchMarketData() {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) {
    throw new Error('SCRAPER_API_KEY environment variable not set');
  }

  const response = await fetch('https://your-scraper-api.vercel.app/api/scrape', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Scraper API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}