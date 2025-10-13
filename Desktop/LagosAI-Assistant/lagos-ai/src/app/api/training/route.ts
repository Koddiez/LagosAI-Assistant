import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { z } from 'zod'

const querySchema = z.object({
  agent_id: z.string().uuid().optional(),
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

    const { agent_id } = validationResult.data

    // First, get the user's agents to ensure they can only access their own training data
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
      return NextResponse.json({ training_data: [] })
    }

    // Build the query
    let query = supabase
      .from('training_data')
      .select(`
        id,
        agent_id,
        type,
        content,
        file_path,
        processed,
        uploaded_at,
        agents (
          id,
          name
        )
      `)
      .in('agent_id', userAgentIds)
      .order('uploaded_at', { ascending: false })

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

    const { data: trainingData, error } = await query

    if (error) {
      console.error('Error fetching training data:', error)
      return NextResponse.json(
        { error: { message: 'Failed to fetch training data', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ training_data: trainingData || [] })
  } catch (error) {
    console.error('Training data API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}