import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps a text colour next to one of our token font sizes', () => {
    expect(cn('text-primary-foreground', 'text-body')).toBe('text-primary-foreground text-body')
  })

  it('still lets a later font size or colour replace an earlier one', () => {
    expect(cn('text-body', 'text-caption')).toBe('text-caption')
    expect(cn('text-foreground', 'text-primary')).toBe('text-primary')
  })
})
