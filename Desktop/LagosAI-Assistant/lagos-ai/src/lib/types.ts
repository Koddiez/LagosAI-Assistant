export interface Profile {
  id: string
  user_type: 'business' | 'individual'
  phone?: string
  whatsapp_number?: string
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  user_id: string
  name: string
  tone_style?: Record<string, any>
  whatsapp_number?: string
  preferences?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  agent_id: string
  direction: 'inbound' | 'outbound'
  content?: string
  media_type: 'text' | 'image' | 'document' | 'voice' | 'video'
  media_url?: string
  whatsapp_message_id?: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

export interface TrainingData {
  id: string
  agent_id: string
  type: 'chat_sample' | 'faq' | 'product_list' | 'company_info'
  content?: Record<string, any>
  file_path?: string
  processed: boolean
  uploaded_at: string
}

export interface MarketData {
  id: string
  item: string
  price: number
  currency: string
  source: string
  location?: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      agents: {
        Row: Agent
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Agent, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'timestamp'>
        Update: Partial<Omit<Message, 'id'>>
      }
      training_data: {
        Row: TrainingData
        Insert: Omit<TrainingData, 'id' | 'uploaded_at'>
        Update: Partial<Omit<TrainingData, 'id'>>
      }
      market_data: {
        Row: MarketData
        Insert: Omit<MarketData, 'id' | 'updated_at'>
        Update: Partial<Omit<MarketData, 'id'>>
      }
    }
  }
}