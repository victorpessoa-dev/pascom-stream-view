'use client'

export default function LoadingState({
  label = 'Carregando...',
  fullScreen = false,
  className = '',
}) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-background ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      {content}
    </div>
  )
}
