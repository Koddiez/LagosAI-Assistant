import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { z } from 'zod'

const querySchema = z.object({
  item: z.string().optional(),
  location: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      item: searchParams.get('item'),
      location: searchParams.get('location'),
    }

    const validationResult = querySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.issues
          }
        },
        { status: 400 }
      )
    }

    const { item, location } = validationResult.data

    // Try to get cached data first
    let query = supabase
      .from('market_data')
      .select('id, item, price, currency, source, location, updated_at')
      .order('updated_at', { ascending: false })

    if (item) {
      query = query.ilike('item', `%${item}%`)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    // Only get data from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    query = query.gte('updated_at', oneDayAgo.toISOString())

    const { data: cachedData, error: cacheError } = await query.limit(50)

    if (cacheError) {
      console.error('Error fetching cached market data:', cacheError)
    }

    // If we have cached data and it's recent (within last hour), return it
    if (cachedData && cachedData.length > 0) {
      const mostRecent = cachedData[0]
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      if (new Date(mostRecent.updated_at) > oneHourAgo) {
        return NextResponse.json({
          prices: cachedData,
          cached: true,
          last_updated: mostRecent.updated_at
        })
      }
    }

    // Fetch fresh data from external APIs
    try {
      const freshData = await fetchFreshMarketData()

      if (freshData && freshData.length > 0) {
        // Cache the fresh data
        const { error: insertError } = await supabase
          .from('market_data')
          .insert(freshData)

        if (insertError) {
          console.error('Error caching market data:', insertError)
        }

        // Filter fresh data based on query parameters
        let filteredData = freshData
        if (item) {
          filteredData = filteredData.filter((data: any) =>
            data.item.toLowerCase().includes(item.toLowerCase())
          )
        }
        if (location) {
          filteredData = filteredData.filter((data: any) =>
            data.location?.toLowerCase().includes(location.toLowerCase())
          )
        }

        return NextResponse.json({
          prices: filteredData,
          cached: false,
          last_updated: new Date().toISOString()
        })
      }
    } catch (fetchError) {
      console.error('Error fetching fresh market data:', fetchError)
    }

    // Return cached data if fresh data fetch failed
    return NextResponse.json({
      prices: cachedData || [],
      cached: true,
      last_updated: cachedData?.[0]?.updated_at || null
    })

  } catch (error) {
    console.error('Market prices API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

async function fetchFreshMarketData() {
  try {
    // Import the scraper API integration
    const { fetchMarketData } = await import('@/lib/fetchMarketData');

    // Call the scraper API to get fresh data
    const scraperResponse = await fetchMarketData();

    if (scraperResponse.data && Array.isArray(scraperResponse.data)) {
      // Transform scraper data to match our expected format
      return scraperResponse.data.map((item: any) => ({
        item: item.item_name || item.item,
        price: item.price,
        currency: 'NGN', // Default to NGN for now
        source: 'Nigerian Market Scraper',
        location: item.location || 'Nigeria',
        updated_at: item.last_updated || new Date().toISOString()
      }));
    }

    // Fallback to empty array if scraper fails
    console.warn('Scraper API returned no data, using empty array');
    return [];
  } catch (error) {
    console.error('Error fetching from scraper API:', error);
    // Return empty array instead of throwing to maintain service availability
    return [];
  }
}