import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '@/types/api'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  meta: PaginationMeta
  onPage: (page: number) => void
}

/** Prev / next pager with a page + total summary. */
export function Pagination({ meta, onPage }: PaginationProps) {
  if (meta.total === 0) return null

  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <p className="text-small text-text-muted">
        Page {meta.currentPage} of {meta.lastPage} · {meta.total} total
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.currentPage <= 1}
          onClick={() => onPage(meta.currentPage - 1)}
          leftIcon={<ChevronLeft className="size-4" />}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.currentPage >= meta.lastPage}
          onClick={() => onPage(meta.currentPage + 1)}
          rightIcon={<ChevronRight className="size-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
