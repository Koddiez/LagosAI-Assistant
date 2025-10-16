# LagosAI Database Schema

## Overview
The database uses Supabase PostgreSQL with the following main tables. Authentication is handled by Supabase Auth, with a profiles table extending user data.

## Tables

### profiles
Extends Supabase auth.users for additional user information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | Primary Key, References auth.users(id) | User ID |
| user_type | text | Not Null, Check (user_type IN ('business', 'individual')) | Type of user |
| phone | text | | Phone number |
| whatsapp_number | text | | WhatsApp number for integration |
| created_at | timestamp | Default now() | Creation timestamp |
| updated_at | timestamp | Default now() | Update timestamp |

### agents
Stores AI agent configurations per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | Primary Key, Default gen_random_uuid() | Agent ID |
| user_id | uuid | Not Null, References profiles(id) | Owner user ID |
| name | text | Not Null | Agent name |
| tone_style | jsonb | | AI tone/style preferences |
| whatsapp_number | text | | Agent's WhatsApp number |
| preferences | jsonb | | Additional settings (language, auto-reply, etc.) |
| is_active | boolean | Default true | Agent active status |
| created_at | timestamp | Default now() | Creation timestamp |
| updated_at | timestamp | Default now() | Update timestamp |

### messages
Logs all WhatsApp messages for analytics and AI learning.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | Primary Key, Default gen_random_uuid() | Message ID |
| agent_id | uuid | Not Null, References agents(id) | Associated agent |
| direction | text | Not Null, Check (direction IN ('inbound', 'outbound')) | Message direction |
| content | text | | Message text content |
| media_type | text | Check (media_type IN ('text', 'image', 'document', 'voice', 'video')) | Type of media |
| media_url | text | | URL/path to media file in Supabase Storage |
| whatsapp_message_id | text | | WhatsApp API message ID |
| timestamp | timestamp | Not Null, Default now() | Message timestamp |
| status | text | Default 'sent', Check (status IN ('sent', 'delivered', 'read', 'failed')) | Message delivery status |

### training_data
Stores uploaded training data for AI customization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | Primary Key, Default gen_random_uuid() | Training data ID |
| agent_id | uuid | Not Null, References agents(id) | Associated agent |
| type | text | Not Null, Check (type IN ('chat_sample', 'faq', 'product_list', 'company_info')) | Type of training data |
| content | jsonb | | Structured content (questions/answers for FAQs, etc.) |
| file_path | text | | Path to uploaded file in Supabase Storage |
| processed | boolean | Default false | Whether AI has processed this data |
| uploaded_at | timestamp | Default now() | Upload timestamp |

### market_data (Optional Cache)
Caches current market prices for AI responses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | Primary Key, Default gen_random_uuid() | Market data ID |
| item | text | Not Null | Item name (e.g., 'rice', 'fuel') |
| price | decimal | Not Null | Current price |
| currency | text | Default 'NGN' | Currency |
| source | text | Not Null | Data source API |
| location | text | | Geographic location in Nigeria |
| updated_at | timestamp | Default now() | Last update timestamp |

## Indexes
- profiles: Index on user_type
- agents: Index on user_id, is_active
- messages: Index on agent_id, timestamp, direction
- training_data: Index on agent_id, type
- market_data: Index on item, updated_at (partial index for recent data)

## Row Level Security (RLS)
- profiles: Users can only access their own profile
- agents: Users can only access agents they own
- messages: Users can only access messages for their agents
- training_data: Users can only access training data for their agents
- market_data: Public read access for AI queries

## Relationships
- profiles (1) → agents (many)
- agents (1) → messages (many)
- agents (1) → training_data (many)