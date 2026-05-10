'use client'

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
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} · {totalItems} {itemLabel}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
          Próxima
        </Button>
      </div>
    </div>
  )
}
