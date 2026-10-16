export function getSafeRedirectPath(redirectToParam, fallback = "/admin") {
  if (
    typeof redirectToParam === "string" &&
    redirectToParam.startsWith("/") &&
    !redirectToParam.startsWith("//") &&
    !redirectToParam.includes("\\")
  ) {
    return redirectToParam;
  }

  return fallback;
}

export async function signInWithPasswordFlow({
  supabase,
  email,
  password,
  router,
  redirectTo = "/admin",
}) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) throw error;

  router.replace(redirectTo);
  router.refresh();
}

export async function requestPasswordReset({ supabase, email, redirectTo }) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });
  if (error) throw error;
}

export async function acceptInviteAndSetPassword({ supabase, password }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user)
    throw new Error(
      "O convite é inválido ou expirou. Solicite um novo convite.",
    );
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return user;
}

export async function exchangeAuthCode({ supabase, code }) {
  if (!code) return;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

export async function signOutFlow(supabase) {
  await supabase.auth.signOut();
}
