import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Feather } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useRegister, useGoogleAuth } from '../features/auth/hooks/useAuth'
import { Button } from '../shared/components/ui/Button'
import { isValidEmail } from '../shared/utils/email'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { mutate: reg, isPending, error: regError } = useRegister()
  const { mutate: googleAuth, error: googleError } = useGoogleAuth()

  const errorMessage = regError
    ? ((regError as any).response?.data?.error ?? 'Registration failed')
    : googleError
      ? 'Google sign-up failed. Please try again.'
      : null
  const emailError = email && !isValidEmail(email) ? 'Enter a valid email address.' : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (emailError) return
    reg({ name, email, password })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <Feather className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold text-slate-900">SyncWrite</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-6 text-center">Create an account</h1>

          {/* Google Sign Up */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={(cred) => {
                if (cred.credential) googleAuth(cred.credential)
              }}
              onError={() => {}}
              width="368"
              text="signup_with"
              shape="rectangular"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">
              or sign up with email
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  emailError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
                placeholder="you@example.com"
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              />
              {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isPending} disabled={!!emailError}>
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
