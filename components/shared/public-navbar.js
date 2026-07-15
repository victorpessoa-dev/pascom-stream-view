'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fallbackProfile = {
  parishName: 'PASCOM Stream View',
  parishLogoUrl: '/brand/icon-logo.svg',
}

export default function PublicNavbar({ showLogin = true }) {
  const [profile, setProfile] = useState(fallbackProfile)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const response = await fetch('/api/perfil-paroquia', { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))

        if (!cancelled && response.ok) {
          setProfile({
            parishName: payload.parishName || fallbackProfile.parishName,
            parishLogoUrl: payload.parishLogoUrl || fallbackProfile.parishLogoUrl,
          })
        }
      } catch {
        if (!cancelled) setProfile(fallbackProfile)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/78">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 xs:gap-4 sm:px-6 sm:py-3 lg:px-8 fhd:max-w-[1600px]">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card sm:h-11 sm:w-11">
            <img src={profile.parishLogoUrl} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0 truncate text-base font-semibold leading-tight sm:text-lg">
            {profile.parishName}
          </span>
        </Link>
        {showLogin ? (
          <Button asChild size="sm" className="shrink-0">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              <span className="hidden xs:inline">Entrar</span>
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  )
}
