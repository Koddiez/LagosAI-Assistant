import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  agent_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month']).optional().default('day'),
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
      agent_id: searchParams.get('agent_id'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      period: searchParams.get('period'),
    }

    const validationResult = analyticsQuerySchema.safeParse(queryParams)
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

    const { agent_id, start_date, end_date, period } = validationResult.data

    // Get user's agents
    const { data: userAgents, error: agentsError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)

    if (agentsError) {
      console.error('Error fetching user agents:', agentsError)
      return NextResponse.json(
        { error: { message: 'Failed to fetch agents', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    const userAgentIds = userAgents?.map(agent => agent.id) || []

    if (userAgentIds.length === 0) {
      return NextResponse.json({
        message_volume: [],
        response_times: [],
        error_rates: [],
        engagement: { total_users: 0, active_users: 0, avg_session_duration: 0 }
      })
    }

    // Verify agent access if specified
    if (agent_id && !userAgentIds.includes(agent_id)) {
      return NextResponse.json(
        { error: { message: 'Agent not found or access denied', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const agentIds = agent_id ? [agent_id] : userAgentIds

    // Get date range
    const endDate = end_date ? new Date(end_date) : new Date()
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    // Fetch message volume data
    const messageVolume = await getMessageVolume(supabase, agentIds, startDate, endDate, period)

    // Fetch response time data
    const responseTimes = await getResponseTimes(supabase, agentIds, startDate, endDate)

    // Fetch error rates
    const errorRates = await getErrorRates(supabase, agentIds, startDate, endDate)

    // Fetch engagement metrics
    const engagement = await getEngagementMetrics(supabase, agentIds, startDate, endDate)

    return NextResponse.json({
      message_volume: messageVolume,
      response_times: responseTimes,
      error_rates: errorRates,
      engagement
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

async function getMessageVolume(
  supabase: any,
  agentIds: string[],
  startDate: Date,
  endDate: Date,
  period: string
) {
  const query = supabase
    .from('messages')
    .select('timestamp, direction')
    .in('agent_id', agentIds)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: true })

  const { data: messages, error } = await query

  if (error || !messages) return []

  // Group by period
  const grouped: Record<string, { inbound: number; outbound: number }> = {}

  messages.forEach((message: any) => {
    const date = new Date(message.timestamp)
    let key: string

    if (period === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else if (period === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = date.toISOString().split('T')[0]
    }

    if (!grouped[key]) {
      grouped[key] = { inbound: 0, outbound: 0 }
    }

    if (message.direction === 'inbound') {
      grouped[key].inbound++
    } else {
      grouped[key].outbound++
    }
  })

  return Object.entries(grouped).map(([date, counts]) => ({
    date,
    inbound: counts.inbound,
    outbound: counts.outbound,
    total: counts.inbound + counts.outbound
  })).sort((a, b) => a.date.localeCompare(b.date))
}

async function getResponseTimes(supabase: any, agentIds: string[], startDate: Date, endDate: Date) {
  // This is a simplified implementation
  // In a real app, you'd need to correlate inbound and outbound messages to calculate actual response times

  const { data: messages, error } = await supabase
    .from('messages')
    .select('timestamp')
    .in('agent_id', agentIds)
    .eq('direction', 'outbound')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())

  if (error || !messages) return []

  // Mock response time distribution (in seconds)
  const responseTimes = [1.2, 2.1, 3.5, 1.8, 4.2, 2.9, 1.5, 3.1, 2.3, 1.9, 5.1, 2.7, 1.3, 3.8, 2.5]

  return [
    { range: '0-1s', count: Math.floor(responseTimes.filter(t => t < 1).length) },
    { range: '1-2s', count: Math.floor(responseTimes.filter(t => t >= 1 && t < 2).length) },
    { range: '2-3s', count: Math.floor(responseTimes.filter(t => t >= 2 && t < 3).length) },
    { range: '3-5s', count: Math.floor(responseTimes.filter(t => t >= 3 && t < 5).length) },
    { range: '5s+', count: Math.floor(responseTimes.filter(t => t >= 5).length) }
  ]
}

async function getErrorRates(supabase: any, agentIds: string[], startDate: Date, endDate: Date) {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('status')
    .in('agent_id', agentIds)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())

  if (error || !messages) {
    return [
      { name: 'Successful', value: 0, percentage: 0 },
      { name: 'Failed', value: 0, percentage: 0 }
    ]
  }

  const successful = messages.filter((m: any) => m.status !== 'failed').length
  const failed = messages.filter((m: any) => m.status === 'failed').length
  const total = messages.length

  return [
    { name: 'Successful', value: successful, percentage: total > 0 ? (successful / total) * 100 : 0 },
    { name: 'Failed', value: failed, percentage: total > 0 ? (failed / total) * 100 : 0 }
  ]
}

async function getEngagementMetrics(supabase: any, agentIds: string[], startDate: Date, endDate: Date) {
  // This is a simplified implementation
  // In a real app, you'd track unique users, session durations, etc.

  const { data: inboundMessages, error } = await supabase
    .from('messages')
    .select('whatsapp_message_id')
    .in('agent_id', agentIds)
    .eq('direction', 'inbound')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())

  if (error) {
    return { total_users: 0, active_users: 0, avg_session_duration: 0 }
  }

  // Mock data - in real implementation, you'd extract unique users from message metadata
  const totalUsers = inboundMessages ? Math.max(1, Math.floor(inboundMessages.length / 5)) : 0
  const activeUsers = Math.floor(totalUsers * 0.7)

  return {
    total_users: totalUsers,
    active_users: activeUsers,
    avg_session_duration: 245 // seconds
  }
}