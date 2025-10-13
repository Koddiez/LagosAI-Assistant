'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Building, ArrowRight, CheckCircle } from 'lucide-react'

type OnboardingStep = 'user-type' | 'profile' | 'agent-setup' | 'whatsapp-setup'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('user-type')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    userType: '' as 'business' | 'individual',
    name: '',
    phone: '',
    companyName: '',
    industry: '',
    businessHours: '',
    communicationStyle: '',
    language: 'English',
    timeZone: 'Africa/Lagos'
  })

  const router = useRouter()
  const supabase = createClient()

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleUserTypeSelect = async (userType: 'business' | 'individual') => {
    setFormData(prev => ({ ...prev, userType }))
    setCurrentStep('profile')
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      setCurrentStep('agent-setup')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAgentSetup = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create default agent
      const agentName = formData.userType === 'business'
        ? `${formData.companyName || formData.name} Assistant`
        : `${formData.name}'s Assistant`

      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: agentName,
          tone_style: {
            formality: formData.userType === 'business' ? 'professional' : 'casual',
            language: formData.language,
            user_type: formData.userType
          },
          preferences: {
            language: formData.language,
            time_zone: formData.timeZone,
            communication_style: formData.communicationStyle
          }
        })
        .select()
        .single()

      if (agentError) throw agentError

      setCurrentStep('whatsapp-setup')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderUserTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Welcome to LagosAI! 🎉</h2>
        <p className="text-gray-600">Let's set up your AI WhatsApp assistant</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleUserTypeSelect('individual')}
        >
          <CardHeader className="text-center">
            <User className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <CardTitle>Individual</CardTitle>
            <CardDescription>
              Personal messaging assistant for friends and family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Casual conversation style</li>
              <li>• Personal chat history training</li>
              <li>• Friend/family communication</li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleUserTypeSelect('business')}
        >
          <CardHeader className="text-center">
            <Building className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <CardTitle>Business</CardTitle>
            <CardDescription>
              Professional assistant for customer service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Professional tone</li>
              <li>• FAQ and product knowledge</li>
              <li>• Customer support automation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderProfileStep = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
        <p className="text-gray-600">This helps us personalize your AI assistant</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            placeholder="+234 xxx xxx xxxx"
            required
          />
        </div>
      </div>

      {formData.userType === 'business' && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                placeholder="Your company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => updateFormData('industry', e.target.value)}
                placeholder="e.g., Retail, Technology, Services"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('user-type')}
        >
          Back
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )

  const renderAgentSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Setting up your AI Agent</h2>
        <p className="text-gray-600">We're creating your personalized assistant</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-blue-100 p-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">
                {formData.userType === 'business'
                  ? `${formData.companyName || formData.name} Assistant`
                  : `${formData.name}'s Assistant`}
              </h3>
              <p className="text-sm text-gray-600">
                {formData.userType === 'business' ? 'Business' : 'Personal'} AI assistant
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('profile')}
        >
          Back
        </Button>
        <Button onClick={handleAgentSetup} disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Agent
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderWhatsappSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Almost there! 📱</h2>
        <p className="text-gray-600">Connect your WhatsApp to start receiving messages</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Account Created</p>
                <p className="text-sm text-gray-600">Your LagosAI account is ready</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">AI Agent Configured</p>
                <p className="text-sm text-gray-600">Your personalized assistant is set up</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Next step: You'll need to connect your WhatsApp Business API in the dashboard.
              </p>
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {(['user-type', 'profile', 'agent-setup', 'whatsapp-setup'] as const).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : ['user-type', 'profile', 'agent-setup', 'whatsapp-setup'].indexOf(currentStep) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {['user-type', 'profile', 'agent-setup', 'whatsapp-setup'].indexOf(currentStep) > index ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`h-1 w-16 mx-2 ${
                    ['user-type', 'profile', 'agent-setup', 'whatsapp-setup'].indexOf(currentStep) > index
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>User Type</span>
            <span>Profile</span>
            <span>Agent Setup</span>
            <span>WhatsApp</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {currentStep === 'user-type' && renderUserTypeStep()}
            {currentStep === 'profile' && renderProfileStep()}
            {currentStep === 'agent-setup' && renderAgentSetupStep()}
            {currentStep === 'whatsapp-setup' && renderWhatsappSetupStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}