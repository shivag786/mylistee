import type { ReactNode } from 'react'
import { Spinner } from '@/components/feedback/Spinner'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  label: string
  className?: string
  cell: (row: T) => ReactNode
}

interface AdminTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
}

/**
 * Generic admin data table. Scrolls horizontally on small screens; the page
 * owns the column definitions and cell rendering.
 */
export function AdminTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading,
  emptyMessage = 'Nothing to show.',
}: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-caption">
        <thead>
          <tr className="border-b border-border text-left text-text-secondary">
            {columns.map((c) => (
              <th key={c.key} className={cn('px-4 py-3 font-medium', c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                <div className="flex justify-center">
                  <Spinner size={24} label="Loading" />
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-border/60 last:border-0 hover:bg-surface-muted/50"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle text-foreground', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
