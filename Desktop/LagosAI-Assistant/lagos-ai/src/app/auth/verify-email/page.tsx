import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, CheckCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We've sent you a verification link to complete your account setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>Click the link in your email to verify your account.</p>
            <p className="mt-2">Didn't receive the email? Check your spam folder.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">What happens next?</p>
                <ul className="mt-1 text-blue-800 space-y-1">
                  <li>• Verify your email address</li>
                  <li>• Complete your profile setup</li>
                  <li>• Set up your first AI agent</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}