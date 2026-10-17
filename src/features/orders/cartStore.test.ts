import { beforeEach, describe, expect, it } from 'vitest'
import { cart, cartSubtotal, lineKey, optionsLabel } from './cartStore'

const shop = { slug: 'pizza-hub', name: 'Pizza Hub' }
const pizza = (variantId: string, addonIds: string[] = []) => ({
  type: 'product' as const,
  id: 'p1',
  name: 'Pizza',
  imageUrl: null,
  unitPrice: variantId === 'lg' ? 400 : 200,
  options: { variantId, variantName: variantId === 'lg' ? 'Large' : 'Small', addonIds, addonNames: addonIds.map(() => 'Cheese') },
})

describe('cart lines with sizes and add-ons', () => {
  beforeEach(() => cart.clear())

  it('keeps each distinct pick on its own line and merges repeats', () => {
    cart.add(shop, pizza('sm'))
    cart.add(shop, pizza('lg', ['chz']))
    cart.add(shop, pizza('lg', ['chz']))
    const items = cart.get()!.items
    expect(items).toHaveLength(2)
    expect(items[1].quantity).toBe(2)
    expect(cartSubtotal(cart.get())).toBe(1000)
    expect(optionsLabel(items[1].options)).toBe('Large · Cheese')
  })

  it('steps a line by its key and decrements the newest pick', () => {
    cart.add(shop, pizza('sm'))
    cart.add(shop, pizza('lg'))
    cart.decrementLatest('product', 'p1')
    expect(cart.get()!.items.map((i) => i.options?.variantId)).toEqual(['sm'])
    cart.setLineQuantity(lineKey(cart.get()!.items[0]), 0)
    expect(cart.get()).toBeNull()
  })
})
