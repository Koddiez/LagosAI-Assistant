import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const generateRequestSchema = z.object({
  agent_id: z.string().uuid('Invalid agent ID'),
  message: z.string().min(1, 'Message is required'),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().min(1).max(4096).optional().default(150),
})

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 50 requests per minute per IP
    const rateLimitResult = await rateLimit({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50,
    })(request as any)

    if (!rateLimitResult.success) {
      const resetTime = rateLimitResult.resetTime || Date.now() + 60000
      return NextResponse.json(
        {
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            resetTime
          }
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = generateRequestSchema.safeParse(body)

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

    const { agent_id, message, context = [], temperature, max_tokens } = validationResult.data

    // Verify the agent belongs to the user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, tone_style, preferences')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { message: 'Agent not found or access denied', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Get relevant market data for context
    const marketData = await getRelevantMarketData(message)

    // Build the system prompt based on agent configuration
    const systemPrompt = buildSystemPrompt(agent, context, marketData)

    // Prepare messages for OpenRouter API
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.slice(-10), // Include last 10 messages for context
      { role: 'user', content: message }
    ]

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'LagosAI Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // Using Claude Haiku for cost-effectiveness
        messages,
        temperature,
        max_tokens,
        top_p: 1,
        stream: false
      })
    })

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json()
      console.error('OpenRouter API error:', errorData)

      return NextResponse.json(
        { error: { message: 'AI service temporarily unavailable', code: 'AI_SERVICE_ERROR' } },
        { status: 503 }
      )
    }

    const aiResponse: OpenRouterResponse = await openRouterResponse.json()
    const generatedResponse = aiResponse.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response at this time.'

    // Log the interaction
    await logInteraction(supabase, agent_id, message, generatedResponse)

    return NextResponse.json({
      response: generatedResponse,
      agent: {
        id: agent.id,
        name: agent.name
      }
    })

  } catch (error) {
    console.error('AI generate API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

async function getRelevantMarketData(message: string) {
  try {
    // Check if the message contains price-related keywords
    const priceKeywords = ['price', 'cost', 'how much', 'rate', 'market', 'buy', 'sell', 'naira', '₦']
    const hasPriceQuery = priceKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    )

    if (!hasPriceQuery) {
      return null
    }

    // Fetch market data
    const marketResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/market/prices`)
    if (!marketResponse.ok) {
      return null
    }

    const marketData = await marketResponse.json()
    return marketData.prices || null
  } catch (error) {
    console.error('Error fetching market data:', error)
    return null
  }
}

function buildSystemPrompt(agent: any, context: any[], marketData: any[] | null): string {
  const { tone_style, preferences } = agent

  let prompt = `You are ${agent.name}, an AI assistant for LagosAI. `

  // Add tone/style instructions
  if (tone_style?.formality === 'professional') {
    prompt += 'You communicate in a professional, courteous manner. '
  } else {
    prompt += 'You communicate in a friendly, conversational manner. '
  }

  // Add language preference
  if (preferences?.language) {
    prompt += `Respond in ${preferences.language}. `
  }

  // Add communication style
  if (preferences?.communication_style) {
    prompt += `Your communication style is ${preferences.communication_style}. `
  }

  // Add context about being a WhatsApp assistant
  prompt += 'You are helping users via WhatsApp, so keep responses concise but helpful. '

  // Add market data if available
  if (marketData && marketData.length > 0) {
    prompt += '\n\nCurrent market prices (as of today):\n'
    marketData.slice(0, 10).forEach(item => {
      const priceFormatted = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }).format(item.price)
      prompt += `- ${item.item}: ${priceFormatted}\n`
    })
    prompt += '\nUse this information when users ask about prices or market rates. '
  } else {
    prompt += 'You have knowledge of Nigerian markets, prices, and local context. When relevant, you can reference current market information. '
  }

  // Add instruction to stay in character
  prompt += 'Always stay in character as a helpful AI assistant and provide accurate, useful information.'

  return prompt
}

async function logInteraction(
  supabase: any,
  agentId: string,
  userMessage: string,
  aiResponse: string
) {
  try {
    // Log user message
    await supabase.from('messages').insert({
      agent_id: agentId,
      direction: 'inbound',
      content: userMessage,
      media_type: 'text'
    })

    // Log AI response
    await supabase.from('messages').insert({
      agent_id: agentId,
      direction: 'outbound',
      content: aiResponse,
      media_type: 'text'
    })
  } catch (error) {
    console.error('Error logging interaction:', error)
    // Don't fail the request if logging fails
  }
}