# LagosAI API Endpoints

## Overview
APIs are implemented using Next.js API routes for serverless functions. Authentication uses Supabase JWT tokens. External APIs handle WhatsApp and AI integration.

## Internal API Endpoints

### Authentication
**POST /api/auth/signup**
- Body: { email, password, phone, user_type }
- Response: { user, token }

**POST /api/auth/login**
- Body: { email, password }
- Response: { user, token }

### Agents Management
**GET /api/agents**
- Headers: Authorization: Bearer {token}
- Response: [{ id, name, whatsapp_number, is_active, ... }]

**POST /api/agents**
- Headers: Authorization: Bearer {token}
- Body: { name, tone_style, whatsapp_number, preferences }
- Response: { agent }

**PUT /api/agents/[id]**
- Headers: Authorization: Bearer {token}
- Body: { name, ... } (partial update)
- Response: { agent }

**DELETE /api/agents/[id]**
- Headers: Authorization: Bearer {token}
- Response: { success: true }

### Messages
**GET /api/messages**
- Query: agent_id, limit, offset
- Headers: Authorization: Bearer {token}
- Response: [{ id, direction, content, timestamp, ... }]

### Training Data
**POST /api/training/upload**
- Headers: Authorization: Bearer {token}, Content-Type: multipart/form-data
- Body: FormData with file, agent_id, type
- Response: { training_data_id }

**GET /api/training**
- Query: agent_id
- Headers: Authorization: Bearer {token}
- Response: [{ id, type, processed, ... }]

### AI Services
**POST /api/ai/generate**
- Headers: Authorization: Bearer {token}
- Body: { agent_id, message, context }
- Response: { response: "AI generated text" }

**POST /api/ai/train**
- Headers: Authorization: Bearer {token}
- Body: { agent_id }
- Response: { status: "training_started" }

### Market Data
**GET /api/market/prices**
- Query: item, location, source, all, limit
- Headers: Authorization: Bearer {token}
- Response: { success: true, data: [{ item, price, currency, source, location, updated_at }], count, filters }
- Notes: Returns data from last 24h by default; use 'all=true' for full history

**GET /api/market/summary**
- Headers: Authorization: Bearer {token}
- Response: { success: true, summary: { total_records, unique_items, sources, top_items } }

### WhatsApp Integration
**POST /api/whatsapp/webhook**
- Body: WhatsApp webhook payload (from Meta)
- Headers: X-Hub-Signature-256 (for verification)
- Response: { status: "ok" }
- Triggers message processing and AI response

**POST /api/whatsapp/send**
- Headers: Authorization: Bearer {token}
- Body: { agent_id, to, message, media }
- Response: { message_id }

## External API Integrations

### WhatsApp Cloud API
- Base URL: https://graph.facebook.com/v18.0/{phone_number_id}
- Send Message: POST /messages
  - Body: { messaging_product: "whatsapp", to, type: "text", text: { body } }
- Receive: Webhook POST to /api/whatsapp/webhook

### OpenRouter API
- Base URL: https://openrouter.ai/api/v1
- Chat Completion: POST /chat/completions
  - Headers: Authorization: Bearer {openrouter_api_key}
  - Body: { model: "anthropic/claude-3-haiku", messages: [{ role, content }], max_tokens, temperature }
  - Response: { choices: [{ message: { content } }] }

### Nigerian Market Data API
- Base URL: https://nigerian-market-api.vercel.app/api (or your deployed URL)
- Authentication: Header `x-api-key: {api_key}`

#### Market Data Endpoints
- GET /api/market/prices - Get filtered market data
  - Query: item, location, source, all, limit
  - Response: { success: true, data: [...], count, filters }

- GET /api/market/summary - Get market statistics
  - Response: { success: true, summary: { total_records, unique_items, sources, top_items } }

#### Scraping Endpoints (Admin)
- POST /api/scrape - Trigger full scraping
- POST /api/scrape/{source} - Trigger specific source scraping
- GET /api/scrape/status - Get scraper status

#### Data Flow
1. Nigerian Market API scrapes → stores in Supabase market_data table
2. LagosAI /api/market/prices queries Supabase with caching
3. AI uses market data for contextual responses
4. Scheduled scraping runs every 4 hours automatically

## Error Handling
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid token)
- 403: Forbidden (insufficient permissions)
- 500: Internal Server Error

All responses include: { error: { message, code } } for errors.