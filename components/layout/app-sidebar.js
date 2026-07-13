'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Monitor,
  Play,
  Settings,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useStore } from '@/lib/store/store'
import { cn } from '@/lib/utils/cn'

const SIDEBAR_STORAGE_KEY = 'pascom:admin-sidebar-collapsed'

const navItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Overlay', href: '/overlay', icon: Monitor },
  { title: 'Painel do telão', href: '/painel-telao', icon: Megaphone },
  { title: 'Configurações', href: '/configuracoes', icon: Settings },
]

const publicLinks = [
  { title: 'Página pública', href: '/', icon: Globe },
  { title: 'Abrir /telao', href: '/telao', icon: Play, target: '_blank' },
  { title: 'Abrir /telao-master', href: '/telao-master', icon: Play, target: '_blank' },
]

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const pathname = usePathname()
  const { overlays, ads, isLoaded } = useStore()

  useEffect(() => {
    const syncCollapsed = () => {
      if (window.innerWidth < 1280) {
        setCollapsed(true)
        return
      }

      setCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
    }

    syncCollapsed()
    window.addEventListener('resize', syncCollapsed)
    return () => window.removeEventListener('resize', syncCollapsed)
  }, [])

  const updateCollapsed = (value) => {
    setCollapsed(value)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value))
    window.dispatchEvent(new CustomEvent('pascom_sidebar_resize'))
  }

  async function onLogout() {
    try {
      await fetch('/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar shadow-2xl shadow-black/20 transition-sidebar',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        <div className={cn('flex min-h-24 items-center border-b border-sidebar-border px-6 py-5', collapsed ? 'justify-center' : 'gap-4')}>
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg p-1">
            <img src="/brand/icon-logo.svg" alt="" className="h-full w-full object-contain" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                PASCOM <span className="text-[11px] font-medium uppercase tracking-wide text-sidebar-muted">Stream View</span>
              </span>
              <span className="mt-1 truncate text-[11px] font-medium text-sidebar-foreground/70">Painel administrativo</span>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const badgeValue =
              item.href === '/overlay'
                ? overlays.length
                : item.href === '/painel-telao'
                  ? ads.filter((ad) => ad.active).length
                  : 0

            const navButton = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed ? (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {isLoaded && badgeValue > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-[10px] font-semibold text-sidebar-accent-foreground">
                        {badgeValue}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </Link>
            )

            if (!collapsed) return navButton

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border px-3 py-6">
          {publicLinks.map((item) => {
            const quickLink = (
              <Link
                key={item.href}
                href={item.href}
                target={item.target}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed ? (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.target ? <ExternalLink className="h-4 w-4 opacity-50" /> : null}
                  </>
                ) : null}
              </Link>
            )

            if (!collapsed) return quickLink

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{quickLink}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        <div className="space-y-2 border-t border-sidebar-border px-3 py-6">
          <button
            type="button"
            onClick={() => updateCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className={cn(
              'hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring xl:flex',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!collapsed ? <span>Recolher menu</span> : null}
          </button>

          {collapsed ? (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-lg p-2.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">Sair</TooltipContent>
              </Tooltip>
              <LogoutDialogContent onConfirm={onLogout} />
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span>Sair</span>
                </button>
              </AlertDialogTrigger>
              <LogoutDialogContent onConfirm={onLogout} />
            </AlertDialog>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

function LogoutDialogContent({ onConfirm }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Sair do painel?</AlertDialogTitle>
        <AlertDialogDescription>
          Sua sessão administrativa será encerrada e você voltará para a tela de login.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Sair</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
