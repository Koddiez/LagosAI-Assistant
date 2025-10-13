import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface WhatsAppMessage {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages?: Array<{
          id: string
          from: string
          timestamp: string
          text?: {
            body: string
          }
          type: string
          context?: {
            from: string
            id: string
          }
        }>
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

// Webhook verification for WhatsApp
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WhatsApp webhook verified successfully')
      return new NextResponse(challenge, { status: 200 })
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  return new NextResponse('Bad Request', { status: 400 })
}

// Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.error('Invalid webhook signature')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const payload: WhatsAppMessage = JSON.parse(body)
    console.log('Received WhatsApp webhook:', JSON.stringify(payload, null, 2))

    // Process the webhook payload
    await processWebhookPayload(payload)

    // Always respond with 200 OK to acknowledge receipt
    return new NextResponse('OK', { status: 200 })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    // Still return 200 to prevent WhatsApp from retrying
    return new NextResponse('OK', { status: 200 })
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_ACCESS_TOKEN!)
    .update(body, 'utf8')
    .digest('hex')

  const receivedSignature = signature.replace('sha256=', '')

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  )
}

async function processWebhookPayload(payload: WhatsAppMessage) {
  // Process each entry
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value

      // Handle messages
      if (value.messages) {
        for (const message of value.messages) {
          if (message.type === 'text' && message.text) {
            await handleIncomingMessage(message, value.metadata.phone_number_id)
          }
        }
      }

      // Handle status updates (optional - for delivery confirmations)
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleMessageStatus(status)
        }
      }
    }
  }
}

async function handleIncomingMessage(
  message: NonNullable<WhatsAppMessage['entry'][0]['changes'][0]['value']['messages']>[0],
  phoneNumberId: string
) {
  try {
    // Find the agent associated with this phone number
    const { createRouteHandlerClient } = await import('@/lib/supabase')
    const supabase = await createRouteHandlerClient()

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, whatsapp_number, tone_style, preferences')
      .eq('whatsapp_number', phoneNumberId)
      .eq('is_active', true)
      .single()

    if (agentError || !agent) {
      console.log(`No active agent found for phone number: ${phoneNumberId}`)
      return
    }

    // Log the incoming message
    await supabase.from('messages').insert({
      agent_id: agent.id,
      direction: 'inbound',
      content: message.text?.body,
      whatsapp_message_id: message.id,
      media_type: 'text'
    })

    // Generate AI response
    const aiResponse = await generateAIResponse(agent, message.text!.body, message.from)

    if (aiResponse) {
      // Send response via WhatsApp
      await sendWhatsAppMessage(phoneNumberId, message.from, aiResponse)

      // Log the outgoing message
      await supabase.from('messages').insert({
        agent_id: agent.id,
        direction: 'outbound',
        content: aiResponse,
        whatsapp_message_id: `response_${message.id}`,
        media_type: 'text'
      })
    }

  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

async function generateAIResponse(agent: any, message: string, sender: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agent.id,
        message: message,
        temperature: 0.7,
        max_tokens: 150
      })
    })

    if (!response.ok) {
      console.error('AI response failed:', response.statusText)
      return "I'm sorry, I'm having trouble responding right now. Please try again later."
    }

    const data = await response.json()
    return data.response

  } catch (error) {
    console.error('Error generating AI response:', error)
    return "I'm sorry, I'm having trouble responding right now. Please try again later."
  }
}

async function sendWhatsAppMessage(phoneNumberId: string, to: string, message: string) {
  try {
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
    console.log('WhatsApp message sent:', result)

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}

async function handleMessageStatus(status: NonNullable<WhatsAppMessage['entry'][0]['changes'][0]['value']['statuses']>[0]) {
  try {
    // Update message status in database
    const { createRouteHandlerClient } = await import('@/lib/supabase')
    const supabase = await createRouteHandlerClient()

    const statusMap: Record<string, string> = {
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed'
    }

    if (statusMap[status.status]) {
      await supabase
        .from('messages')
        .update({ status: statusMap[status.status] })
        .eq('whatsapp_message_id', status.id)
    }

  } catch (error) {
    console.error('Error handling message status:', error)
  }
}