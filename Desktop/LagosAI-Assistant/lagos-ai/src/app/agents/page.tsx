'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bot,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Settings,
  MessageSquare,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  tone_style?: Record<string, any>
  whatsapp_number?: string
  preferences?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    tone_style: 'professional',
    whatsapp_number: '',
    language: 'English',
    communication_style: 'friendly'
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data.agents)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      tone_style: 'professional',
      whatsapp_number: '',
      language: 'English',
      communication_style: 'friendly'
    })
  }

  const handleCreateAgent = async () => {
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          tone_style: {
            formality: formData.tone_style,
          },
          whatsapp_number: formData.whatsapp_number,
          preferences: {
            language: formData.language,
            communication_style: formData.communication_style,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to create agent')
      }

      await fetchAgents()
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAgent = async () => {
    if (!editingAgent) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          tone_style: {
            formality: formData.tone_style,
          },
          whatsapp_number: formData.whatsapp_number,
          preferences: {
            language: formData.language,
            communication_style: formData.communication_style,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update agent')
      }

      await fetchAgents()
      setIsEditDialogOpen(false)
      setEditingAgent(null)
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to delete agent')
      }

      await fetchAgents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openEditDialog = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      tone_style: agent.tone_style?.formality || 'professional',
      whatsapp_number: agent.whatsapp_number || '',
      language: agent.preferences?.language || 'English',
      communication_style: agent.preferences?.communication_style || 'friendly',
    })
    setIsEditDialogOpen(true)
  }

  const AgentCard = ({ agent }: { agent: Agent }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription>
              Created {new Date(agent.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
            {agent.is_active ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
              </>
            )}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/simulator?agent=${agent.id}`)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Test Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(agent)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteAgent(agent.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {agent.whatsapp_number && (
            <div>
              <span className="font-medium">WhatsApp:</span> {agent.whatsapp_number}
            </div>
          )}
          <div>
            <span className="font-medium">Style:</span> {agent.tone_style?.formality || 'Professional'}
          </div>
          <div>
            <span className="font-medium">Language:</span> {agent.preferences?.language || 'English'}
          </div>
          <div>
            <span className="font-medium">Communication:</span> {agent.preferences?.communication_style || 'Friendly'}
          </div>
        </div>
      </CardContent>
    </Card>
  )

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
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
            <p className="text-gray-600 mt-1">Manage your AI assistants and their configurations</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
                <DialogDescription>
                  Configure your AI assistant with custom settings and preferences.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Agent Name</Label>
                  <Input
                    id="agent-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Customer Support Bot"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone-style">Communication Style</Label>
                  <Select value={formData.tone_style} onValueChange={(value) => setFormData(prev => ({ ...prev, tone_style: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">WhatsApp Number (Optional)</Label>
                  <Input
                    id="whatsapp-number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Pidgin">Pidgin</SelectItem>
                      <SelectItem value="Yoruba">Yoruba</SelectItem>
                      <SelectItem value="Hausa">Hausa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent} disabled={submitting || !formData.name.trim()}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Agent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && !isCreateDialogOpen && !isEditDialogOpen && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agents yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first AI assistant to start automating conversations.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update your AI assistant's configuration and preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-agent-name">Agent Name</Label>
                <Input
                  id="edit-agent-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Customer Support Bot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tone-style">Communication Style</Label>
                <Select value={formData.tone_style} onValueChange={(value) => setFormData(prev => ({ ...prev, tone_style: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp-number">WhatsApp Number (Optional)</Label>
                <Input
                  id="edit-whatsapp-number"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Pidgin">Pidgin</SelectItem>
                    <SelectItem value="Yoruba">Yoruba</SelectItem>
                    <SelectItem value="Hausa">Hausa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAgent} disabled={submitting || !formData.name.trim()}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}