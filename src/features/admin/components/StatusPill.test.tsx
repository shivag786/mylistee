import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from './StatusPill'

describe('StatusPill', () => {
  it('renders the status label', () => {
    render(<StatusPill status="active" />)
    // getByText throws if absent, so this asserts the label rendered.
    expect(screen.getByText('active')).toBeTruthy()
  })

  it('humanizes underscored statuses', () => {
    render(<StatusPill status="sold_out" />)
    expect(screen.getByText('sold out')).toBeTruthy()
  })
})
