'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare,
  Zap,
  Clock,
  TrendingUp,
  Bot,
  PlayCircle,
  Upload,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MessageCircle,
  User,
  Phone
} from 'lucide-react';

interface DashboardStats {
  totalMessages: number;
  autoReplies: number;
  responseTime: number;
  satisfactionRate: number;
  activeConversations: number;
  resolutionRate: number;
}

interface Agent {
  id: string;
  name: string;
  is_active: boolean;
  whatsapp_number?: string;
  last_active?: string;
  status?: 'online' | 'offline' | 'away';
  avatar?: string;
}

interface RecentMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  content?: string;
  timestamp: string;
  status: 'delivered' | 'read' | 'failed' | 'sent';
  contact_name?: string;
  contact_avatar?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    autoReplies: 0,
    responseTime: 0,
    satisfactionRate: 0
  })
  const [agents, setAgents] = useState<Agent[]>([])
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, is_active, whatsapp_number')
        .eq('user_id', user.id)

      if (agentsError) throw agentsError
      setAgents(agentsData || [])

      // Fetch recent messages for the user's agents
      if (agentsData && agentsData.length > 0) {
        const agentIds = agentsData.map(agent => agent.id)
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('id, direction, content, timestamp, status')
          .in('agent_id', agentIds)
          .order('timestamp', { ascending: false })
          .limit(10)

        if (messagesError) throw messagesError
        setRecentMessages(messagesData || [])

        // Calculate stats
        const totalMessages = messagesData?.length || 0
        const autoReplies = messagesData?.filter(m => m.direction === 'outbound').length || 0
        const avgResponseTime = 2.5 // Mock data - would calculate from actual timestamps
        const satisfactionRate = 85 // Mock data

        setStats({
          totalMessages,
          autoReplies,
          responseTime: avgResponseTime,
          satisfactionRate
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your AI assistants.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto Replies</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.autoReplies}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalMessages > 0 ? Math.round((stats.autoReplies / stats.totalMessages) * 100) : 0}% of total messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responseTime}s</div>
              <p className="text-xs text-muted-foreground">
                Within target range
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.satisfactionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Based on user feedback
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Messages */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest conversations with your AI assistants</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm">Messages will appear here once your AI starts responding</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.slice(0, 5).map((message) => (
                    <div key={message.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className={`rounded-full p-2 ${
                        message.direction === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <MessageSquare className={`h-4 w-4 ${
                          message.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {message.direction === 'inbound' ? 'Customer' : 'AI Assistant'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {message.content || 'Media message'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Agents */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/simulator">
                <Button className="w-full justify-start" variant="outline">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Test AI Response
                </Button>
              </Link>

              {agents.length === 0 ? (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm text-gray-600">No agents configured</p>
                  <p className="text-xs text-gray-500">Complete onboarding to create your first agent</p>
                </div>
              ) : (
                <>
                  <Link href="/training">
                    <Button className="w-full justify-start" variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Training Data
                    </Button>
                  </Link>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Your Agents</h4>
                    <div className="space-y-2">
                      {agents.slice(0, 3).map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Bot className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-600">{agent.name}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            agent.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                        </div>
                      ))}
                      {agents.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{agents.length - 3} more agents
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}