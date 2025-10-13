import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { z } from 'zod'

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tone_style: z.record(z.string(), z.unknown()).optional(),
  whatsapp_number: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Agents API: Auth error:', authError)
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    console.log('Agents API: Fetching agents for user:', user.id)
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, user_id, name, tone_style, whatsapp_number, preferences, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Agents API: Database error:', error)
    } else {
      console.log('Agents API: Found agents count:', agents?.length || 0)
    }

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json(
        { error: { message: 'Failed to fetch agents', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = createAgentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.issues
          }
        },
        { status: 400 }
      )
    }

    const agentData = {
      user_id: user.id,
      name: validationResult.data.name,
      tone_style: validationResult.data.tone_style || {},
      whatsapp_number: validationResult.data.whatsapp_number,
      preferences: validationResult.data.preferences || {},
      is_active: true,
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating agent:', error)
      return NextResponse.json(
        { error: { message: 'Failed to create agent', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}