import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.DATABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check DATABASE_URL and SERVICE_ROLE_KEY environment variables.');
}

// Create Supabase client with service role for admin operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to insert market data
export const insertMarketData = async (data) => {
  const { error } = await supabase
    .from('market_data')
    .insert(data);

  if (error) {
    console.error('Error inserting market data:', error);
    throw error;
  }

  console.log(`Inserted ${data.length} market data records`);
  return true;
};

// Function to get market data with optional filters
export const getMarketData = async (filters = {}) => {
  let query = supabase
    .from('market_data')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters.item) {
    query = query.ilike('item', `%${filters.item}%`);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters.source) {
    query = query.eq('source', filters.source);
  }

  // Only get data from the last 24 hours unless specified otherwise
  if (!filters.all) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    query = query.gte('updated_at', oneDayAgo.toISOString());
  }

  const { data, error } = await query.limit(filters.limit || 100);

  if (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }

  return data;
};