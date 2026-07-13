import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_PATHS = ['/admin', '/configuracoes', '/editor', '/overlay', '/painel-telao']
const PUBLIC_PATHS = ['/', '/anunciantes', '/login', '/shared', '/telao', '/telao-master', '/telao/visualizar']

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function isProtectedPath(pathname) {
  if (isPublicPath(pathname)) return false
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/api')) return false
  return ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'missing_supabase_env')
    url.searchParams.set('redirectTo', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', data.user.id)
    .single()

  if (profileError || profile?.is_admin !== true) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'admin_required')
    url.searchParams.set('redirectTo', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
