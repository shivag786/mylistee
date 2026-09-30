/**
 * Razorpay mounts into <body>; an open Radix modal sets pointer-events: none on
 * <body> until its exit animation ends. Opened in that window, Checkout cannot
 * be clicked. These pin that the wait lets go exactly when the page does --
 * and never hangs a payment when something else holds it.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { waitForPageInteractive } from './razorpay'

afterEach(() => {
  document.body.style.pointerEvents = ''
})

describe('waitForPageInteractive', () => {
  it('goes straight through when nothing is blocking the page', async () => {
    const started = performance.now()
    await waitForPageInteractive()
    expect(performance.now() - started).toBeLessThan(50)
  })

  it('waits while a modal still holds the page, then lets go with it', async () => {
    document.body.style.pointerEvents = 'none'
    let settled = false
    const waiting = waitForPageInteractive().then(() => {
      settled = true
    })

    await new Promise((r) => setTimeout(r, 80))
    expect(settled).toBe(false) // still closing -- Checkout must not open yet

    document.body.style.pointerEvents = '' // Radix lets go after its animation
    await waiting
    expect(settled).toBe(true)
  })

  it('never leaves a payment hanging if the page stays blocked', async () => {
    document.body.style.pointerEvents = 'none'
    const started = performance.now()
    await waitForPageInteractive(150)
    expect(performance.now() - started).toBeGreaterThanOrEqual(140)
  })
})

// The premise, checked against the real Sheet rather than assumed: an open one
// blocks the page (which is what made Checkout unclickable), and closing it
// hands the page back, which is what the cart now waits for.

function Cart({ open }: { open: boolean }) {
  return (
    <Sheet open={open}>
      <SheetContent>
        <SheetTitle>Your order</SheetTitle>
        <SheetDescription>Cart</SheetDescription>
      </SheetContent>
    </Sheet>
  )
}

describe('the cart sheet and Checkout', () => {
  it('blocks the page while open -- the cause of the unclickable payment window', () => {
    render(<Cart open />)
    expect(document.body.style.pointerEvents).toBe('none')
  })

  it('hands the page back once closed, so Checkout opens clickable', async () => {
    const { rerender } = render(<Cart open />)
    rerender(<Cart open={false} />)

    await waitForPageInteractive()
    expect(document.body.style.pointerEvents).not.toBe('none')
  })
})
