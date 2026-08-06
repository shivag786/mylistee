/**
 * New-order alert sound (Phase 7.5). By default a short synthesized "ding" via
 * the Web Audio API (no asset to ship). An admin can upload a custom sound
 * (GET /config → orderSoundUrl); when set, `beep()` plays that instead.
 *
 * Browsers require a user gesture before audio can start — call `armBeep()` from
 * a click handler once, then `beep()` plays freely.
 */
let ctx: AudioContext | null = null
let armed = false

// Admin-uploaded custom sound, if any.
let customUrl: string | null = null
let customAudio: HTMLAudioElement | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  return ctx
}

/** Unlock an <audio> element within a user gesture so later `.play()` isn't blocked. */
function unlock(el: HTMLAudioElement): void {
  el.muted = true
  el.play()
    .then(() => {
      el.pause()
      el.currentTime = 0
      el.muted = false
    })
    .catch(() => {
      el.muted = false
    })
}

/** Point the alert at an admin-uploaded sound (or null to use the built-in ding). */
export function setOrderSoundUrl(url: string | null): void {
  if (url === customUrl) return
  customUrl = url
  if (url) {
    customAudio = typeof Audio !== 'undefined' ? new Audio(url) : null
    if (customAudio) {
      customAudio.preload = 'auto'
      if (armed) unlock(customAudio)
    }
  } else {
    customAudio = null
  }
}

/** Prime audio from a user gesture so later beeps aren't blocked. */
export function armBeep(): void {
  armed = true
  const c = context()
  if (c && c.state === 'suspended') void c.resume()
  if (customAudio) unlock(customAudio)
}

export function beep(): void {
  // Prefer the admin-uploaded sound when configured.
  if (customAudio) {
    customAudio.currentTime = 0
    customAudio.play().catch(() => synthBeep())
    return
  }
  synthBeep()
}

function synthBeep(): void {
  const c = context()
  if (!c) return
  if (c.state === 'suspended') void c.resume()

  const play = (startAt: number, freq: number) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3)
    osc.start(startAt)
    osc.stop(startAt + 0.32)
  }

  // Two quick rising tones — a friendly "ding-dong".
  play(c.currentTime, 880)
  play(c.currentTime + 0.18, 1174)
}
