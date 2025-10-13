'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import {
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  BarChart3
} from 'lucide-react'

interface Agent {
  id: string
  name: string
}

interface AnalyticsData {
  message_volume: Array<{
    date: string
    inbound: number
    outbound: number
    total: number
  }>
  response_times: Array<{
    range: string
    count: number
  }>
  error_rates: Array<{
    name: string
    value: number
    percentage: number
  }>
  engagement: {
    total_users: number
    active_users: number
    avg_session_duration: number
  }
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

export default function AnalyticsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('30d')
  const [period, setPeriod] = useState<string>('day')

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    if (agents.length > 0) {
      fetchAnalytics()
    }
  }, [selectedAgent, dateRange, period, agents])

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

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
      })

      if (selectedAgent !== 'all') {
        params.append('agent_id', selectedAgent)
      }

      // Calculate date range
      const endDate = new Date()
      let startDate: Date

      switch (dateRange) {
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      params.append('start_date', startDate.toISOString())
      params.append('end_date', endDate.toISOString())

      const response = await fetch(`/api/analytics?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalyticsData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Insights into your AI agents' performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={fetchAnalytics}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent</label>
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
                <label className="text-sm font-medium">Time Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  {analyticsData && (
                    <div>
                      <div>Total Messages: {analyticsData.message_volume.reduce((sum, item) => sum + item.total, 0)}</div>
                      <div>Active Users: {analyticsData.engagement.active_users}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Volume Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Message Volume Over Time
              </CardTitle>
              <CardDescription>
                Track inbound and outbound messages over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.message_volume || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={formatDate}
                      formatter={(value, name) => [value, name === 'inbound' ? 'Inbound' : 'Outbound']}
                    />
                    <Line
                      type="monotone"
                      dataKey="inbound"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Inbound"
                    />
                    <Line
                      type="monotone"
                      dataKey="outbound"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Outbound"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Response Times Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Response Time Distribution
              </CardTitle>
              <CardDescription>
                How quickly your AI responds to messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.response_times || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Error Rates Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Success vs Error Rates
              </CardTitle>
              <CardDescription>
                Message delivery success rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData?.error_rates || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${(percentage as number).toFixed(1)}%`}
                    >
                      {analyticsData?.error_rates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.engagement.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                Unique users who sent messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.engagement.active_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                Users active in the last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((analyticsData?.engagement.avg_session_duration || 0) / 60)}m</div>
              <p className="text-xs text-muted-foreground">
                Average conversation length
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}