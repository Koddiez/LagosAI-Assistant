# LagosAI - WhatsApp AI Assistant Platform

A comprehensive web-based platform for creating and managing AI-powered WhatsApp assistants with real-time conversation capabilities, analytics, and market data integration.

## 🚀 Features

### Core Functionality
- **AI-Powered Conversations**: Real-time chat with Claude AI via OpenRouter
- **Multi-Agent Support**: Create and manage multiple AI assistants
- **WhatsApp Integration**: Full webhook support for incoming/outgoing messages
- **Training Data Upload**: Customize agents with chat samples, FAQs, and product data
- **Market Data Integration**: Real-time Nigerian market prices for enhanced responses

### User Experience
- **Beautiful Dashboard**: Modern UI with analytics and performance metrics
- **Chat Simulator**: Test your AI agents before going live
- **Message History**: Complete conversation logs with filtering and search
- **Agent Management**: Full CRUD operations for AI assistants
- **Responsive Design**: Works perfectly on desktop and mobile

### Analytics & Insights
- **Performance Metrics**: Message volume, response times, success rates
- **Interactive Charts**: Time-series data with customizable date ranges
- **Engagement Tracking**: User activity and conversation analytics
- **Real-time Updates**: Live dashboard with refresh capabilities

### Security & Privacy
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive sanitization and validation
- **Audit Logging**: Complete activity tracking
- **Secure Headers**: Modern web security headers
- **Data Isolation**: User data completely segregated

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI**: OpenRouter API (Claude 3 Haiku)
- **WhatsApp**: Meta WhatsApp Cloud API
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel with optimized configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter API key
- WhatsApp Business API credentials

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd lagos-ai
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token
   MARKET_API_KEY=your_market_api_key
   ```

3. **Set up Supabase database:**
   - Create a new Supabase project
   - Run the SQL migrations in `database_schema.sql`
   - Enable Row Level Security (RLS) policies

4. **Configure WhatsApp:**
   - Set up Meta WhatsApp Business API
   - Configure webhook URL: `https://yourapp.com/api/whatsapp/webhook`
   - Set verify token to match your environment variable

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see your LagosAI platform!

## 📦 Build & Deployment

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Vercel Deployment
The project is optimized for Vercel deployment:

1. **Connect to Vercel:**
   ```bash
   npx vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard or CLI

3. **Configure domain** and SSL certificates

### Database Setup
Run these SQL commands in your Supabase SQL editor:

```sql
-- Create tables and indexes as defined in database_schema.md
-- Enable RLS and create policies for data security
-- Set up storage buckets for file uploads
```

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENROUTER_API_KEY`: OpenRouter API key for AI
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp API access token
- `WHATSAPP_VERIFY_TOKEN`: WhatsApp webhook verification token

### Rate Limiting
- AI API: 50 requests per minute per IP
- File uploads: 10MB max file size
- Input validation: Comprehensive sanitization

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Agents
- `GET /api/agents` - List user agents
- `POST /api/agents` - Create new agent
- `PUT /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent

### Messages
- `GET /api/messages` - Get message history
- `POST /api/whatsapp/send` - Send WhatsApp message

### AI & Training
- `POST /api/ai/generate` - Generate AI response
- `POST /api/training/upload` - Upload training data
- `GET /api/training` - Get training data

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/market/prices` - Get market prices

### WhatsApp Integration
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Handle incoming messages

## 🔒 Security

- **Rate Limiting**: Prevents API abuse
- **Input Sanitization**: XSS and SQL injection protection
- **Audit Logging**: Complete activity tracking
- **CORS Configuration**: Secure cross-origin requests
- **Security Headers**: Modern web security standards

## 📈 Performance

- **Optimized Builds**: Tree-shaking and code splitting
- **Caching**: Intelligent data caching strategies
- **CDN**: Global content delivery via Vercel
- **Database Indexing**: Optimized queries with proper indexes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Use GitHub issues for bug reports
- **Discussions**: Use GitHub discussions for questions

## 🎯 Roadmap

- [ ] Admin panel for system management
- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Voice message support
- [ ] Integration with other messaging platforms
- [ ] Advanced AI model selection
- [ ] Team collaboration features

---

Built with ❤️ for the LagosAI community
