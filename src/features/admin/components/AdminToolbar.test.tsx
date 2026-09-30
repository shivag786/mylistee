/**
 * The toolbar is shared by every admin list. The extra dropdowns are new, so
 * pin both that they work and that pages which pass none look as before.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminToolbar } from './AdminToolbar'

describe('AdminToolbar', () => {
  it('adds an extra filter that reports its choice', async () => {
    const onChange = vi.fn()
    render(
      <AdminToolbar
        search=""
        onSearch={() => undefined}
        filters={[
          {
            label: 'Filter by payment',
            allLabel: 'Any payment',
            value: undefined,
            options: [{ value: 'partial', label: 'Advance online' }],
            onChange,
          },
        ]}
      />,
    )

    await userEvent.selectOptions(screen.getByLabelText('Filter by payment'), 'partial')
    expect(onChange).toHaveBeenCalledWith('partial')
  })

  it('shows no extra dropdowns on pages that pass none', () => {
    render(<AdminToolbar search="" onSearch={() => undefined} />)
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
