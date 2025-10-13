import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { z } from 'zod'

const querySchema = z.object({
  agent_id: z.string().uuid().optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional().default(50),
  offset: z.string().transform(val => parseInt(val)).refine(val => val >= 0, 'Offset must be non-negative').optional().default(0),
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
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
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

    const { agent_id, limit, offset } = validationResult.data

    // First, get the user's agents to ensure they can only access their own messages
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
      return NextResponse.json({ messages: [], total: 0 })
    }

    // Build the query
    let query = supabase
      .from('messages')
      .select(`
        id,
        agent_id,
        direction,
        content,
        media_type,
        media_url,
        whatsapp_message_id,
        timestamp,
        status,
        agents (
          id,
          name
        )
      `)
      .in('agent_id', userAgentIds)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by specific agent if provided
    if (agent_id) {
      if (!userAgentIds.includes(agent_id)) {
        return NextResponse.json(
          { error: { message: 'Agent not found or access denied', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
      query = query.eq('agent_id', agent_id)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: { message: 'Failed to fetch messages', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('agent_id', userAgentIds)

    if (agent_id) {
      countQuery = countQuery.eq('agent_id', agent_id)
    }

    const { count } = await countQuery

    return NextResponse.json({
      messages: messages || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}