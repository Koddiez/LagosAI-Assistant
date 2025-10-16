# 🚀 Deployment Guide: Nigerian Market Data API

Follow these steps to deploy the scraper API and complete LagosAI integration.

## 🧾 STEP 1 — Configure Environment Variables

Edit `nigerian-market-api/.env` with your real credentials:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_from_supabase
API_KEY=your_secure_api_key_here_generate_random_string
PORT=4000
```

### How to Get Supabase Credentials:
1. Go to [supabase.com](https://supabase.com) → Your Project → Settings → API
2. Copy **Project URL** → `SUPABASE_URL`
3. Copy **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)
4. Generate a secure API key → `API_KEY` (use a long random string)

## 🧰 STEP 2 — Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Nigerian Market Scraper API"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Vercel will auto-detect Node.js settings

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env` file
   - **Important:** Set them for **Production**, **Preview**, and **Development**

4. **Deploy:**
   - Click "Deploy"
   - Wait for build completion
   - Get your deployment URL: `https://your-project.vercel.app`

### Option B: Vercel CLI

```bash
npm install -g vercel
cd nigerian-market-api
vercel --prod
# Follow prompts to link project and add environment variables
```

## ⏰ STEP 3 — Set Up Automatic Scraping (Cron Jobs)

### Vercel Cron Jobs Setup:

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Cron Jobs
   - Click "Add Cron Job"

2. **Configure Cron Job:**
   ```
   Name: Market Data Scraper
   Path: /api/scrape
   Schedule: 0 */4 * * *
   Method: POST
   Headers: x-api-key: your_api_key_here
   ```

3. **Save and Enable**

This runs the scraper every 4 hours automatically.

### Alternative: GitHub Actions

Create `.github/workflows/scrape.yml` in the scraper repo:

```yaml
name: Market Data Scraper
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Scrape Market Data
        run: |
          curl -X POST https://your-vercel-url.vercel.app/api/scrape \
            -H "x-api-key: your_api_key"
```

## 🧩 STEP 4 — Test LagosAI Integration

### Test the Scraper API:
```bash
# Health check
curl https://your-vercel-url.vercel.app/health

# Manual scrape
curl -X POST https://your-vercel-url.vercel.app/api/scrape \
  -H "x-api-key: your_api_key"

# Check market data
curl https://your-vercel-url.vercel.app/api/market/prices
```

### Test LagosAI (Database Integration):
```bash
# LagosAI should now return real data instead of mock data
curl https://your-lagosai-url.vercel.app/api/market/prices \
  -H "Authorization: Bearer your_jwt_token"
```

You should see real Nigerian market prices from Nairametrics, Punch, etc.!

## 🔧 Troubleshooting

### Scraper Not Working:
- Check Vercel logs for errors
- Verify environment variables are set correctly
- Test individual scraper endpoints: `/api/scrape/nairametrics`

### LagosAI Still Shows Mock Data:
- The scraper must successfully populate Supabase first
- Check Supabase dashboard → Table Editor → market_data table
- Wait for cron job to run, or trigger manually

### Permission Errors:
- Ensure `SUPABASE_SERVICE_ROLE_KEY` has database insert permissions
- Check RLS policies on market_data table

## 📊 Monitoring

- **Vercel Analytics:** Track API usage and errors
- **Supabase Dashboard:** Monitor data inserts and table growth
- **Logs:** Check Vercel function logs for scraping status

## 🚀 Next Steps (Optional Upgrades)

### Option A: Direct API Integration
Update LagosAI to fetch directly from scraper:

```typescript
// In LagosAI /api/market/prices
const scraperResponse = await fetch(`${process.env.SCRAPER_URL}/api/scrape`, {
  headers: { 'x-api-key': process.env.SCRAPER_API_KEY }
});
const freshData = await scraperResponse.json();
```

### Option B: Webhook Integration
Set up webhooks so scraper notifies LagosAI when new data is available.

## ✅ Success Checklist

- [ ] `.env` configured with real credentials
- [ ] Code deployed to Vercel successfully
- [ ] Environment variables set in Vercel
- [ ] Cron job configured and running
- [ ] Scraper populating Supabase database
- [ ] LagosAI returning real market data
- [ ] Test queries working in production

🎉 **Congratulations!** Your LagosAI now has a competitive data moat with real-time Nigerian market intelligence! 🇳🇬💪