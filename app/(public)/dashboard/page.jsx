import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createSupabaseServerClient } from '@/services/supabase/server'

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${r}s`
  return `${r}s`
}

export default async function PublicDashboardPage() {
  let stats = null
  let sponsors = []
  let error = null

  try {
    const supabase = await createSupabaseServerClient()

    const [{ data: statsData, error: statsErr }, { data: sponsorsData, error: sponsorsErr }] =
      await Promise.all([
        supabase.rpc('get_public_stats'),
        supabase.rpc('get_public_sponsors'),
      ])

    if (statsErr) throw statsErr
    if (sponsorsErr) throw sponsorsErr

    stats = Array.isArray(statsData) ? statsData[0] : statsData
    sponsors = Array.isArray(sponsorsData) ? sponsorsData : []
  } catch (e) {
    error = e instanceof Error ? e.message : 'Falha ao carregar informações'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard público</h1>
            <p className="text-muted-foreground mt-1">
              Informações do telão e patrocinadores.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/telao/visualizar" target="_blank">
              <Button className="gap-2">Abrir telão</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Entrar</Button>
            </Link>
          </div>
        </div>

        {error && <div className="mb-6 text-sm text-destructive">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Exibições do telão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats ? stats.telao_total_views : '-'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tempo total exibindo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats ? formatDuration(stats.telao_total_seconds) : '-'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Patrocínios ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats ? stats.sponsors_active : '-'}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats ? `De ${stats.sponsors_total} cadastrados` : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Patrocinadores ativos</h2>
          {sponsors.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum patrocínio ativo.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.map((s) => (
                <Card key={s.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {s.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.image_url}
                          alt={s.name || 'Patrocinador'}
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.kind}</div>
                        {s.website_url && (
                          <a
                            href={s.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary hover:underline inline-block mt-2"
                          >
                            Site
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

