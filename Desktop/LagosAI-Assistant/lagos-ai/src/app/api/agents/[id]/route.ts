import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { z } from 'zod'

const updateAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  tone_style: z.record(z.string(), z.unknown()).optional(),
  whatsapp_number: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   try {
     const resolvedParams = await params
     const supabase = await createRouteHandlerClient()
     const { data: { user }, error: authError } = await supabase.auth.getUser()

     if (authError || !user) {
       return NextResponse.json(
         { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
         { status: 401 }
       )
     }

     const { data: agent, error } = await supabase
       .from('agents')
       .select('id, user_id, name, tone_style, whatsapp_number, preferences, is_active, created_at, updated_at')
       .eq('id', resolvedParams.id)
       .eq('user_id', user.id)
       .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { message: 'Agent not found', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
      console.error('Error fetching agent:', error)
      return NextResponse.json(
        { error: { message: 'Failed to fetch agent', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function PUT(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   try {
     const resolvedParams = await params
     const supabase = await createRouteHandlerClient()
     const { data: { user }, error: authError } = await supabase.auth.getUser()

     if (authError || !user) {
       return NextResponse.json(
         { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
         { status: 401 }
       )
     }

     const body = await request.json()
     const validationResult = updateAgentSchema.safeParse(body)

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

     // First check if the agent belongs to the user
     const { data: existingAgent, error: checkError } = await supabase
       .from('agents')
       .select('id')
       .eq('id', resolvedParams.id)
       .eq('user_id', user.id)
       .single()

    if (checkError || !existingAgent) {
      return NextResponse.json(
        { error: { message: 'Agent not found or access denied', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString()
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating agent:', error)
      return NextResponse.json(
        { error: { message: 'Failed to update agent', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   try {
     const resolvedParams = await params
     const supabase = await createRouteHandlerClient()
     const { data: { user }, error: authError } = await supabase.auth.getUser()

     if (authError || !user) {
       return NextResponse.json(
         { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
         { status: 401 }
       )
     }

     // First check if the agent belongs to the user
     const { data: existingAgent, error: checkError } = await supabase
       .from('agents')
       .select('id')
       .eq('id', resolvedParams.id)
       .eq('user_id', user.id)
       .single()

    if (checkError || !existingAgent) {
      return NextResponse.json(
        { error: { message: 'Agent not found or access denied', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting agent:', error)
      return NextResponse.json(
        { error: { message: 'Failed to delete agent', code: 'DATABASE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}