import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-card p-8">
        <div className="text-3xl font-bold tracking-tight">404</div>
        <div className="text-muted-foreground mt-2">
          Essa página não existe ou foi movida.
        </div>
        <div className="flex gap-3 mt-6">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">Dashboard público</Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="secondary" className="w-full">Entrar</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

