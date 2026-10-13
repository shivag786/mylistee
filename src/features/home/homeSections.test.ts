import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT, currentSlot, resolveLayout, visibleSections, type HomeSectionSetting } from './homeSections'

describe('home layout', () => {
  it('uses the built-in order when nothing is saved', () => {
    expect(resolveLayout(null)).toEqual(DEFAULT_LAYOUT)
  })

  it('keeps the saved order and slots missing sections in at their default place', () => {
    const saved: HomeSectionSetting[] = [
      { id: 'reels', enabled: true },
      { id: 'hero', enabled: true },
      { id: 'stories', enabled: true },
    ]
    const ids = resolveLayout(saved).map((s) => s.id)
    // The saved three keep their relative order…
    expect(ids.filter((id) => ['reels', 'hero', 'stories'].includes(id))).toEqual(['reels', 'hero', 'stories'])
    // …and each missing section follows its default predecessor.
    expect(ids[ids.indexOf('stories') + 1]).toBe('banners_top')
    expect(ids[ids.indexOf('reels') + 1]).toBe('combos')
    expect(ids).toHaveLength(DEFAULT_LAYOUT.length)
  })

  it('hides switched-off sections and ones for another part of the day', () => {
    const saved: HomeSectionSetting[] = [
      { id: 'hero', enabled: false },
      { id: 'combos', enabled: true, slot: 'afternoon' },
      { id: 'deals', enabled: true, slot: 'morning' },
    ]
    const morning = visibleSections(saved, new Date('2026-10-09T09:00:00')).map((s) => s.id)
    expect(morning).not.toContain('hero')
    expect(morning).toContain('deals')
    expect(morning).not.toContain('combos')
  })

  it('maps hours to parts of the day', () => {
    expect(currentSlot(new Date('2026-10-09T06:00:00'))).toBe('morning')
    expect(currentSlot(new Date('2026-10-09T13:00:00'))).toBe('afternoon')
    expect(currentSlot(new Date('2026-10-09T18:00:00'))).toBe('evening')
    expect(currentSlot(new Date('2026-10-09T23:30:00'))).toBe('night')
    expect(currentSlot(new Date('2026-10-09T03:00:00'))).toBe('night')
  })
})
