'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Send,
  Bot,
  User,
  Settings,
  RotateCcw,
  Loader2,
  MessageSquare
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  tone_style?: Record<string, any>
  preferences?: Record<string, any>
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function SimulatorPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [temperature, setTemperature] = useState([0.7])
  const [maxTokens, setMaxTokens] = useState([150])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('agents')
        .select('id, name, tone_style, preferences')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error
      setAgents(data || [])

      // Auto-select first agent
      if (data && data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0].id)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)
    setError('')

    try {
      // Call AI API
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: selectedAgent,
          message: currentMessage,
          context: messages.slice(-10).map(m => ({ // Send last 10 messages as context
            role: m.role,
            content: m.content
          })),
          temperature: temperature[0],
          max_tokens: maxTokens[0]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to get AI response')
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (err: any) {
      setError('Failed to get AI response: ' + err.message)
    } finally {
      setLoading(false)
    }
  }


  const clearChat = () => {
    setMessages([])
    setError('')
  }

  const selectedAgentData = agents.find(a => a.id === selectedAgent)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat Simulator</h1>
          <p className="text-gray-600 mt-1">Test your AI assistant's responses in real-time</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Conversation
                    </CardTitle>
                    <CardDescription>
                      {selectedAgentData ? `Chatting with ${selectedAgentData.name}` : 'Select an agent to start chatting'}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearChat}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear Chat
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Start a conversation by typing a message below</p>
                      <p className="text-sm">Your AI assistant will respond based on its training</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            {message.role === 'user' ? (
                              <User className="h-4 w-4 mr-2" />
                            ) : (
                              <Bot className="h-4 w-4 mr-2" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.role === 'user' ? 'You' : selectedAgentData?.name || 'Assistant'}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-2" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={loading || !selectedAgent}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim() || !selectedAgent}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </CardTitle>
                <CardDescription>Configure your AI assistant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agent Selection */}
                <div className="space-y-2">
                  <Label htmlFor="agent-select">Select Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label>Temperature: {temperature[0]}</Label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Controls randomness: Lower = more focused, Higher = more creative
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <Label>Max Tokens: {maxTokens[0]}</Label>
                  <Slider
                    value={maxTokens}
                    onValueChange={setMaxTokens}
                    max={500}
                    min={50}
                    step={25}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Maximum response length
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agent Info */}
            {selectedAgentData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedAgentData.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Tone:</span>{' '}
                      {selectedAgentData.tone_style?.formality === 'professional' ? 'Professional' : 'Casual'}
                    </div>
                    <div>
                      <span className="font-medium">Language:</span>{' '}
                      {selectedAgentData.preferences?.language || 'English'}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className="text-green-600">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}