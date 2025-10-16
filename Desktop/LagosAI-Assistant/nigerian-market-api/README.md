# 🇳🇬 Nigerian Market Data API

A comprehensive API that scrapes and provides real-time market data from Nigerian sources, specifically designed to power LagosAI's market intelligence features.

## 🚀 Features

- **Multi-Source Scraping**: Collects data from Nairametrics, Punch, AbokiFX, NNPC, and Jumia
- **Real-time Prices**: Commodities, forex rates, fuel prices, and consumer goods
- **Automated Updates**: Scheduled scraping every 4 hours
- **Supabase Integration**: Reliable data storage with existing LagosAI infrastructure
- **API Key Security**: Protected endpoints for secure access
- **Comprehensive Data**: Clean, validated market information

## 📋 Prerequisites

- Node.js 18+
- Supabase project (with market_data table)
- API key for authentication

## 🛠️ Installation & Setup

1. **Clone and navigate to the API directory:**
   ```bash
   cd nigerian-market-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials and generate a secure API key.

4. **Test the scraper locally:**
   ```bash
   npm run test
   ```
   This runs a comprehensive test of all scraping functions and database connectivity.

5. **Start the server:**
   ```bash
   npm run dev  # Development mode with auto-restart
   npm start    # Production mode
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for data insertion | Yes |
| `API_KEY` | Secret key for API authentication | Yes |
| `PORT` | Server port (default: 4000) | No |

### Supabase Setup

The API uses the existing `market_data` table:

```sql
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item TEXT NOT NULL,
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'NGN',
  source TEXT NOT NULL,
  location TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📡 API Endpoints

### Authentication
All scraping endpoints require API key in header:
```
x-api-key: your_api_key_here
```

### Market Data Endpoints

#### GET /api/market/prices
Get market prices with optional filters.

**Query Parameters:**
- `item`: Filter by item name (partial match)
- `location`: Filter by location
- `source`: Filter by data source
- `all`: Include all historical data (default: last 24h only)
- `limit`: Maximum results (default: 100)

**Example:**
```bash
curl "http://localhost:4000/api/market/prices?item=rice&limit=10"
```

#### GET /api/market/summary
Get market data statistics and summaries.

### Scraping Endpoints

#### POST /api/scrape
Trigger manual scraping from all sources.

```bash
curl -X POST http://localhost:4000/api/scrape \
  -H "x-api-key: your_api_key"
```

#### POST /api/scrape/:source
Trigger scraping from a specific source.

```bash
curl -X POST http://localhost:4000/api/scrape/nairametrics \
  -H "x-api-key: your_api_key"
```

#### GET /api/scrape/status
Get scraper service status.

## 🔄 Data Sources

The API scrapes from these Nigerian sources:

1. **Nairametrics** - Financial news and commodity prices
2. **Punch Newspaper** - Business news and market updates
3. **AbokiFX** - Black market forex rates
4. **NNPC** - Official fuel prices and energy data
5. **Jumia** - Retail prices for consumer goods

## 🤖 LagosAI Integration

This API feeds data into LagosAI's market intelligence:

1. **Data Flow**: Scraper → Supabase → LagosAI API → AI Assistant
2. **Caching**: LagosAI API caches recent data for fast responses
3. **Fallback**: Uses cached data if scraping fails
4. **Context**: AI gets latest market trends for personalized responses

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub repository**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**: Automatic on push to main branch

### Render

1. **Create Web Service** from GitHub repo
2. **Set build command**: `npm install`
3. **Set start command**: `npm start`
4. **Configure environment variables**

### Railway

1. **Connect GitHub repo**
2. **Set PORT environment variable**
3. **Deploy automatically**

## 📊 Monitoring

- Check `/health` endpoint for service status
- Monitor logs for scraping success/failures
- Use `/api/scrape/status` for scraper diagnostics
- Supabase dashboard for data verification

## 🛡️ Security

- API key authentication for all sensitive endpoints
- Rate limiting on public endpoints
- Service role key for database operations
- CORS enabled for web applications

## 🤖 LagosAI Integration

This scraper API is designed to work seamlessly with LagosAI for market intelligence:

### How It Works
1. **Scraper runs automatically** every 4 hours via cron jobs
2. **Data stored in Supabase** `market_data` table
3. **LagosAI queries database** for real market prices
4. **AI uses data** in conversational responses

### Integration Options

#### Option A: Database Integration (Current)
- Scraper populates Supabase
- LagosAI queries database directly
- ✅ Simple, reliable, no code changes needed

#### Option B: Direct API Calls (Future)
```javascript
// LagosAI can fetch fresh data directly
const response = await fetch('https://your-scraper.vercel.app/api/scrape', {
  headers: { 'x-api-key': process.env.SCRAPER_API_KEY }
});
```

### Testing Integration
```bash
# Test scraper populates database
npm run test

# Test LagosAI gets real data
curl "https://your-lagosai.app/api/market/prices"
```

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Test scraper functions on target websites
4. Ensure data validation works correctly
5. Submit a pull request

## 📄 License

MIT License - feel free to use in your LagosAI-powered applications.

## 🆘 Troubleshooting

**Scraping fails:**
- Check target website structure hasn't changed
- Verify network connectivity
- Review error logs for specific issues

**Database connection issues:**
- Confirm Supabase credentials
- Check RLS policies allow service role access
- Verify market_data table exists

**API authentication errors:**
- Ensure x-api-key header is present
- Verify API key matches environment variable