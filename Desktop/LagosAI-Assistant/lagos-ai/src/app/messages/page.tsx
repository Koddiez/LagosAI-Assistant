'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Bot,
  User
} from 'lucide-react'

interface Message {
  id: string
  agent_id: string
  direction: 'inbound' | 'outbound'
  content?: string
  media_type: string
  media_url?: string
  whatsapp_message_id?: string
  timestamp: string
  status: string
  agents?: {
    id: string
    name: string
  }
}

interface Agent {
  id: string
  name: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedDirection, setSelectedDirection] = useState<string>('all')
  const [sortField, setSortField] = useState<'timestamp' | 'direction' | 'status'>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalMessages, setTotalMessages] = useState(0)
  const [pageSize] = useState(20)

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [selectedAgent, selectedDirection, sortField, sortDirection, currentPage])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (err: any) {
      console.error('Error fetching agents:', err)
    }
  }

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      })

      if (selectedAgent !== 'all') {
        params.append('agent_id', selectedAgent)
      }

      const response = await fetch(`/api/messages?${params}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()

      setMessages(data.messages || [])
      setTotalMessages(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: 'timestamp' | 'direction' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ?
      <ArrowUp className="h-4 w-4" /> :
      <ArrowDown className="h-4 w-4" />
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchTerm ||
      (message.content && message.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (message.agents?.name && message.agents.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDirection = selectedDirection === 'all' || message.direction === selectedDirection

    return matchesSearch && matchesDirection
  })

  const totalPages = Math.ceil(totalMessages / pageSize)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default'
      case 'sent': return 'secondary'
      case 'read': return 'default'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">View and manage all your AI conversations</p>
          </div>
          <Button onClick={fetchMessages} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-filter">Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction-filter">Direction</Label>
                <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directions</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Results</Label>
                <div className="flex items-center h-10 px-3 text-sm text-gray-600 bg-gray-50 rounded-md">
                  {filteredMessages.length} of {totalMessages} messages
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>
              Complete conversation history across all your agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                <p className="text-gray-600">
                  {messages.length === 0
                    ? "Messages will appear here once your AI agents start responding to conversations."
                    : "Try adjusting your filters to see more messages."
                  }
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center">
                          Timestamp
                          {getSortIcon('timestamp')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('direction')}
                      >
                        <div className="flex items-center">
                          Direction
                          {getSortIcon('direction')}
                        </div>
                      </TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(message.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {message.direction === 'inbound' ? (
                              <div className="flex items-center text-blue-600">
                                <User className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">Inbound</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-green-600">
                                <Bot className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">Outbound</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Bot className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm">{message.agents?.name || 'Unknown Agent'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            {message.content ? (
                              <p className="text-sm text-gray-900 truncate">
                                {message.content}
                              </p>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <Phone className="h-4 w-4 mr-1" />
                                <span className="text-sm">{message.media_type}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(message.status)}>
                            {message.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalMessages)} of {totalMessages} messages
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}