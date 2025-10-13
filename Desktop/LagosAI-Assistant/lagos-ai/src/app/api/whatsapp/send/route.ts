import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { z } from 'zod'

const sendMessageSchema = z.object({
  agent_id: z.string().uuid('Invalid agent ID'),
  to: z.string().min(1, 'Recipient phone number is required'),
  message: z.string().min(1, 'Message content is required'),
  media: z.object({
    type: z.enum(['text', 'image', 'document', 'audio', 'video']).optional(),
    url: z.string().url().optional(),
    caption: z.string().optional()
  }).optional()
})

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
    const validationResult = sendMessageSchema.safeParse(body)

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

    const { agent_id, to, message, media } = validationResult.data

    // Verify the agent belongs to the user and get phone number ID
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, whatsapp_number')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { message: 'Agent not found or access denied', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (!agent.whatsapp_number) {
      return NextResponse.json(
        { error: { message: 'Agent does not have a WhatsApp number configured', code: 'CONFIGURATION_ERROR' } },
        { status: 400 }
      )
    }

    // Send message via WhatsApp API
    let messageId: string

    if (media && media.type && media.url && media.type !== 'text') {
      // Send media message
      messageId = await sendWhatsAppMediaMessage(agent.whatsapp_number, to, { type: media.type, url: media.url, caption: media.caption }, message)
    } else {
      // Send text message
      messageId = await sendWhatsAppTextMessage(agent.whatsapp_number, to, message)
    }

    // Log the outgoing message
    await supabase.from('messages').insert({
      agent_id: agent.id,
      direction: 'outbound',
      content: message,
      whatsapp_message_id: messageId,
      media_type: media?.type || 'text'
    })

    return NextResponse.json({
      message_id: messageId,
      status: 'sent'
    }, { status: 200 })

  } catch (error) {
    console.error('Send WhatsApp message API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

async function sendWhatsAppTextMessage(phoneNumberId: string, to: string, message: string): Promise<string> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API error:', error)
    throw new Error('Failed to send WhatsApp message')
  }

  const result = await response.json()
  return result.messages[0].id
}

async function sendWhatsAppMediaMessage(
  phoneNumberId: string,
  to: string,
  media: { type: string; url: string; caption?: string },
  textMessage: string
): Promise<string> {
  const mediaPayload: any = {
    messaging_product: 'whatsapp',
    to: to,
    type: media.type
  }

  // Add media-specific fields
  if (media.type === 'image') {
    mediaPayload.image = {
      link: media.url,
      caption: media.caption || textMessage
    }
  } else if (media.type === 'document') {
    mediaPayload.document = {
      link: media.url,
      caption: media.caption || textMessage
    }
  } else if (media.type === 'audio') {
    mediaPayload.audio = {
      link: media.url
    }
  } else if (media.type === 'video') {
    mediaPayload.video = {
      link: media.url,
      caption: media.caption || textMessage
    }
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mediaPayload)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API error:', error)
    throw new Error('Failed to send WhatsApp media message')
  }

  const result = await response.json()

  // If there's also a text message, send it separately
  if (textMessage && media.caption !== textMessage) {
    await sendWhatsAppTextMessage(phoneNumberId, to, textMessage)
  }

  return result.messages[0].id
}