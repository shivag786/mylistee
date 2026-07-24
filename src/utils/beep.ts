/**
 * A short synthesized "ding" for new-order alerts (Phase 7.5). Uses the Web
 * Audio API so there's no asset to ship. Browsers require a user gesture before
 * audio can start — call `armBeep()` from a click handler once, then `beep()`
 * plays freely.
 */
let ctx: AudioContext | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  return ctx
}

/** Prime the audio context from a user gesture so later beeps aren't blocked. */
export function armBeep(): void {
  const c = context()
  if (c && c.state === 'suspended') void c.resume()
}

export function beep(): void {
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
