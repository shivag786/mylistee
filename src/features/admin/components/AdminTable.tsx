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
 * Generic admin data table. On a phone every row becomes a card — the first
 * column is its title, unlabelled columns (actions) sit top-right, the rest
 * are label/value lines — so nothing scrolls sideways. From `md` up it is a
 * normal table. The page owns the column definitions and cell rendering.
 */
export function AdminTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading,
  emptyMessage = 'Nothing to show.',
}: AdminTableProps<T>) {
  const [first, ...rest] = columns
  const actions = rest.filter((c) => !c.label)
  const fields = rest.filter((c) => c.label)

  if (isLoading) {
    return (
      <div className="flex justify-center rounded-card border border-border bg-surface px-4 py-12">
        <Spinner size={24} label="Loading" />
      </div>
    )
  }
  if (rows.length === 0) {
    return <div className="rounded-card border border-border bg-surface px-4 py-12 text-center text-caption text-text-muted">{emptyMessage}</div>
  }

  return (
    <>
      {/* Phone: one card per row. */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={getRowKey(row)} className="rounded-card border border-border bg-surface p-4 text-caption shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 break-words text-foreground">{first?.cell(row)}</div>
              {actions.length > 0 && (
                <div className="flex shrink-0 items-center gap-1">
                  {actions.map((c) => (
                    <div key={c.key}>{c.cell(row)}</div>
                  ))}
                </div>
              )}
            </div>
            {fields.length > 0 && (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 border-t border-border/60 pt-3">
                {fields.map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-small text-text-muted">{c.label}</dt>
                    <dd className="min-w-0 break-words text-foreground">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>

      {/* Tablet and up: the table. */}
      <div className="hidden overflow-x-auto rounded-card border border-border bg-surface md:block">
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
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/50">
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle text-foreground', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
