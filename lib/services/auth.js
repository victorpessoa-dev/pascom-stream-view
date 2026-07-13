export function getSafeRedirectPath(redirectToParam, fallback = '/admin') {
  if (
    typeof redirectToParam === 'string'
    && redirectToParam.startsWith('/')
    && !redirectToParam.startsWith('//')
  ) {
    return redirectToParam
  }

  return fallback
}

export async function signInWithPasswordFlow({ supabase, email, password, router, redirectTo = '/admin' }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  router.replace(redirectTo)
  router.refresh()
}

export async function signOutFlow(supabase) {
  await supabase.auth.signOut()
}
