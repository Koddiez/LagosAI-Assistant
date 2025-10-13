'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react'

interface Agent {
  id: string
  name: string
}

interface TrainingData {
  id: string
  agent_id: string
  type: 'chat_sample' | 'faq' | 'product_list' | 'company_info'
  content?: Record<string, any>
  file_path?: string
  processed: boolean
  uploaded_at: string
  agents?: {
    id: string
    name: string
  }
}

export default function TrainingPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedType, setSelectedType] = useState<TrainingData['type']>('chat_sample')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0].id)
    }
  }, [agents, selectedAgent])

  useEffect(() => {
    if (selectedAgent) {
      fetchTrainingData()
    }
  }, [selectedAgent])

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

  const fetchTrainingData = async () => {
    try {
      const response = await fetch(`/api/training?agent_id=${selectedAgent}`)
      if (!response.ok) throw new Error('Failed to fetch training data')
      const data = await response.json()
      setTrainingData(data.training_data || [])
    } catch (err: any) {
      console.error('Error fetching training data:', err)
      setTrainingData([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedAgent) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('agent_id', selectedAgent)
      formData.append('type', selectedType)

      const response = await fetch('/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Upload failed')
      }

      const result = await response.json()
      await fetchTrainingData() // Refresh the list

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Show success message
      setError('')
      alert('Training data uploaded successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteTrainingData = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training data? This action cannot be undone.')) {
      return
    }

    try {
      // Note: We don't have a DELETE endpoint yet, so this is a placeholder
      alert('Delete functionality will be implemented in the API')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getTypeLabel = (type: TrainingData['type']) => {
    switch (type) {
      case 'chat_sample': return 'Chat Sample'
      case 'faq': return 'FAQ'
      case 'product_list': return 'Product List'
      case 'company_info': return 'Company Info'
      default: return type
    }
  }

  const getTypeDescription = (type: TrainingData['type']) => {
    switch (type) {
      case 'chat_sample': return 'Past chat conversations to learn communication style'
      case 'faq': return 'Frequently asked questions and answers'
      case 'product_list': return 'Product catalog and pricing information'
      case 'company_info': return 'Company background, policies, and procedures'
      default: return ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Data</h1>
          <p className="text-gray-600 mt-1">Upload data to customize your AI agents</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Training Data
                </CardTitle>
                <CardDescription>
                  Add data to improve your AI agent's responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="data-type">Data Type</Label>
                  <Select value={selectedType} onValueChange={(value: TrainingData['type']) => setSelectedType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat_sample">Chat Sample</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                      <SelectItem value="product_list">Product List</SelectItem>
                      <SelectItem value="company_info">Company Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {getTypeDescription(selectedType)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">File Upload</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.csv,.pdf,.doc,.docx"
                    disabled={uploading || !selectedAgent}
                  />
                  <p className="text-xs text-gray-500">
                    Supported: TXT, CSV, PDF, DOC, DOCX (max 10MB)
                  </p>
                </div>

                {uploading && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading and processing...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Training Data List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Uploaded Data</CardTitle>
                    <CardDescription>
                      Training data for {agents.find(a => a.id === selectedAgent)?.name || 'selected agent'}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchTrainingData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {trainingData.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No training data yet</h3>
                    <p className="text-gray-600 mb-4">
                      Upload your first training file to customize your AI agent.
                    </p>
                    <p className="text-sm text-gray-500">
                      Try uploading chat samples, FAQs, or product lists to improve responses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trainingData.map((data) => (
                      <div key={data.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {data.file_path?.split('/').pop() || 'Training Data'}
                              </h4>
                              <Badge variant="outline">
                                {getTypeLabel(data.type)}
                              </Badge>
                              <Badge variant={data.processed ? 'default' : 'secondary'}>
                                {data.processed ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Processed
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Processing
                                  </>
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Uploaded {new Date(data.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTrainingData(data.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}