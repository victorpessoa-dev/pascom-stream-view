'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  itemLabel = 'itens',
  totalItems = 0,
}) {
  if (totalPages <= 1) return null

  return (
    <nav
      className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginação"
    >
      <div className="text-sm text-muted-foreground" aria-live="polite">
        Página {currentPage} de {totalPages} · {totalItems} {itemLabel}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Ir para a página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Ir para a próxima página"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
