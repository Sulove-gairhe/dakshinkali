'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, LockKeyhole, Mail, Phone, Sparkles, UserPlus } from 'lucide-react'
import { SiteNavbar } from '@/components/site-navbar'
import { useAuth } from '@dakshinkali/auth'

type AuthMode = 'signin' | 'signup'

const highlights = [
  {
    title: 'JWT-backed sessions',
    description: 'One session keeps the storefront and API in sync.',
  },
  {
    title: 'Theme-aligned UI',
    description: 'Matches the yellow, black, and card language of the site.',
  },
  {
    title: 'Customer access',
    description: 'Sign in to view your account and order history.',
  },
]

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-card p-8 text-sm font-semibold text-muted-foreground shadow-sm">
          Loading secure access...
        </div>
      </section>
    </main>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, signIn, signUp } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/account'

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo)
    }
  }, [loading, redirectTo, router, user])

  const isSignup = authMode === 'signup'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }

        if (password.length < 8) {
          setError('Password must be at least 8 characters.')
          return
        }

        const { error: signUpError } = await signUp(email, password, {
          full_name: fullName,
          phone,
          role: 'customer',
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        setAuthMode('signin')
        setConfirmPassword('')
        setPassword('')
        setNotice('Account created. If email verification is enabled, check your inbox and then sign in.')
        return
      }

      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.replace(redirectTo)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-14">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-secondary p-8 text-secondary-foreground shadow-xl sm:p-10">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Secure access
            </div>

            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Sign in or create your Dakshinkali account.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-secondary-foreground/75 sm:text-base">
                Use one Supabase session to keep your storefront, profile, cart, and orders in sync.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h2 className="text-sm font-bold text-primary">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-secondary-foreground/70">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-2 rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin')
                setError('')
                setNotice('')
              }}
              className={
                authMode === 'signin'
                  ? 'rounded-full bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm'
                  : 'rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground'
              }
              aria-pressed={authMode === 'signin'}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup')
                setError('')
                setNotice('')
              }}
              className={
                authMode === 'signup'
                  ? 'rounded-full bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm'
                  : 'rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground'
              }
              aria-pressed={authMode === 'signup'}
            >
              Create account
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                {isSignup ? 'New customer' : 'Returning customer'}
              </p>
              <h2 className="text-2xl font-bold">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isSignup
                  ? 'Create an account to save carts, track orders, and keep your profile synced.'
                  : 'Sign in with your Supabase email and password.'}
              </p>
            </div>

            {isSignup ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 sm:col-span-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Full name
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    placeholder="Your full name"
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Mail className="h-4 w-4 text-primary" />
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Phone className="h-4 w-4 text-primary" />
                    Phone
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    placeholder="9800000000"
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>
            ) : (
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
            )}

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <LockKeyhole className="h-4 w-4 text-primary" />
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="Enter password"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>

            {isSignup ? (
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  Confirm password
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? 'Please wait' : isSignup ? 'Create account' : 'Sign in'}
            </button>

            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {notice ? (
              <p className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                {notice}
              </p>
            ) : null}

            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p>
                {isSignup
                  ? 'After signup, check your inbox if email verification is enabled.'
                  : 'You will be sent to your account page after sign in.'}
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
