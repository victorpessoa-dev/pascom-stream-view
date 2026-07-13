'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'
import { getSafeRedirectPath, signInWithPasswordFlow } from '@/lib/services/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppFooter from '@/components/shared/app-footer'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = getSafeRedirectPath(searchParams.get('redirectTo'))

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()
      await signInWithPasswordFlow({
        supabase,
        email,
        password,
        router,
        redirectTo,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <img src="/brand/emblema-16-9.svg" alt="PASCOM Stream View" className="h-14 w-fit object-contain align-center" />
            <CardTitle className='text-center '>Acessar Painel Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                  autoComplete="email"
                  aria-invalid={Boolean(error)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                />
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  )
}
