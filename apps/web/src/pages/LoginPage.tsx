import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Feather } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useLogin, useGoogleAuth } from '../features/auth/hooks/useAuth'
import { Button } from '../shared/components/ui/Button'
import { isValidEmail } from '../shared/utils/email'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { mutate: login, isPending: isLoginPending, error: loginError } = useLogin()
  const { mutate: googleAuth, error: googleError } = useGoogleAuth()

  const errorMessage = loginError
    ? ((loginError as any).response?.data?.error ?? 'Invalid email or password')
    : googleError
      ? 'Google sign-in failed. Please try again.'
      : null
  const emailError = email && !isValidEmail(email) ? 'Enter a valid email address.' : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (emailError) return
    login({ email, password })
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
          <h1 className="text-xl font-semibold text-slate-900 mb-6 text-center">Welcome back</h1>

          {/* Google Sign In */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={(cred) => {
                if (cred.credential) googleAuth(cred.credential)
              }}
              onError={() => {}}
              width="368"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">
              or continue with email
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isLoginPending} disabled={!!emailError}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
