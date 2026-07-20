import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

/**
 * Composite labeled input built on the ShadCN Input + Label primitives. Label
 * ALWAYS above the field, validation below (document-00A §14, phase/05).
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, leftIcon, id, className, ...props },
  ref,
) {
  const autoId = React.useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </span>
        )}
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(leftIcon && 'pl-11', className)}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-caption text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
