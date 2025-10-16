# Deployment and Hosting Strategy

## Hosting Platforms

### Frontend & API Routes: Vercel
- **Why Vercel**: Seamless Next.js integration, global CDN, serverless functions
- **Features**: Automatic scaling, preview deployments, analytics
- **Cost**: Free tier for starters, pay-as-you-go for production

### Backend Services: Supabase
- **Database**: PostgreSQL with built-in connection pooling
- **Auth**: User management, JWT handling
- **Storage**: File uploads with CDN
- **Edge Functions**: For custom serverless logic if needed

### Alternative: Lovable Cloud
- If using Lovable, deploy directly from their platform
- Integrated with their tools for faster setup

## Deployment Process

### 1. Project Setup
```bash
# Initialize Next.js project
npx create-next-app@latest lagos-ai --typescript --tailwind --app

# Initialize Supabase
npx supabase init
npx supabase start  # For local development
```

### 2. Supabase Configuration
```sql
-- Run in Supabase SQL Editor
-- Create tables from database_schema.md
-- Enable RLS and create policies
-- Create storage buckets for files
```

### 3. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repo for auto-deploy
```

### 4. Environment Variables
Create `.env.local` and set in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENROUTER_API_KEY=your_openrouter_key
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
MARKET_API_KEY=your_market_api_key
```

### 5. Build Configuration
`vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Development Workflow

### Local Development
```bash
# Start Supabase locally
npx supabase start

# Run Next.js dev server
npm run dev

# Access at http://localhost:3000
```

### Staging Environment
- Use Vercel preview deployments for staging
- Separate Supabase project for staging data
- Automated tests before production deploy

### Production Deployment
- GitHub Actions for CI/CD
- Automated testing and linting
- Manual approval for production releases

## Scaling Strategy

### Vercel Scaling
- Serverless functions auto-scale
- Global CDN for static assets
- Bandwidth limits: Monitor and upgrade as needed

### Supabase Scaling
- Database: Connection pooling, read replicas if needed
- Storage: CDN delivery, automatic scaling
- Free tier limits: Monitor usage and upgrade

### Performance Optimization
- Image optimization with Next.js
- API response caching
- Database query optimization
- CDN for static files

## Monitoring & Maintenance

### Monitoring Tools
- **Vercel Analytics**: Response times, error rates
- **Supabase Dashboard**: Database performance, logs
- **OpenRouter**: API usage and costs
- **WhatsApp**: Message delivery stats

### Backup & Recovery
- **Database**: Supabase automated daily backups
- **Files**: Versioned storage with retention policies
- **Code**: Git versioning with protected main branch

### Maintenance Tasks
- Weekly: Review error logs and performance metrics
- Monthly: Update dependencies and security patches
- Quarterly: Security audits and penetration testing

## Cost Estimation

### Free Tier (Development)
- Vercel: 100GB bandwidth, 1000 functions
- Supabase: 500MB database, 1GB storage
- OpenRouter: Free credits for testing

### Production (Estimated Monthly)
- Vercel: $20-50 (hobby plan)
- Supabase: $25-100 (pro plan)
- OpenRouter: $10-50 (based on usage)
- Domain: $10-20/year
- Total: $65-220/month

## Rollback Strategy
- Vercel: Instant rollback to previous deployments
- Database: Point-in-time recovery from backups
- Feature flags for gradual rollouts

## Go-Live Checklist
- [ ] Domain configured
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] Database migrated
- [ ] WhatsApp webhook configured
- [ ] API keys tested
- [ ] Monitoring alerts setup
- [ ] Backup verified
- [ ] Performance tested
- [ ] Security scan completed