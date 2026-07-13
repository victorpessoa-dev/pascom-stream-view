import { cn } from '@/lib/utils/cn'

export default function PageContainer({ children, className, size = 'default' }) {
  const maxWidth = size === 'narrow' ? 'max-w-5xl' : 'max-w-6xl'

  return (
    <div className={cn('mx-auto w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8', maxWidth, className)}>
      {children}
    </div>
  )
}
