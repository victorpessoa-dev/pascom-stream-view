import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8">
        <img src="/brand/emblema-16-9.svg" alt="PASCOM Stream View" className="mb-6 h-14 w-fit object-contain" />
        <div className="text-3xl font-bold tracking-tight">404</div>
        <div className="mt-2 text-muted-foreground">Essa página não existe ou foi movida.</div>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="flex-1">
            <Button className="w-full">Página pública</Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="secondary" className="w-full">Entrar</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
