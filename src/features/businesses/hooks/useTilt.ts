import { useEffect, type PointerEvent } from 'react'
import { useMotionValue, useReducedMotion, useSpring, type MotionValue } from 'framer-motion'

/** Max tilt in degrees — enough to read as 3D without the dish looking warped. */
const MAX_TILT = 14

type OrientationPermission = 'granted' | 'denied' | 'unsupported'

interface IOSDeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

let permission: OrientationPermission | null = null

/**
 * iOS only lets a page read the gyroscope after the person allows it, and the
 * prompt may only be raised from a tap. Call this inside the tap that opens a
 * tilt view. Android and desktop need no prompt, so it resolves straight away.
 */
export async function requestTiltPermission(): Promise<OrientationPermission> {
  if (permission) return permission
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
    permission = 'unsupported'
    return permission
  }
  const request = (DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent).requestPermission
  if (typeof request !== 'function') {
    permission = 'granted'
    return permission
  }
  try {
    permission = await request()
  } catch {
    permission = 'denied'
  }
  return permission
}

const clamp = (v: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v))

export interface Tilt {
  /** Degrees around the X axis (top edge away from / toward the viewer). */
  rotateX: MotionValue<number>
  /** Degrees around the Y axis (left/right). */
  rotateY: MotionValue<number>
  /** Pointer handlers for desktop, or a phone without gyroscope access. */
  bind: {
    onPointerMove: (e: PointerEvent<HTMLElement>) => void
    onPointerLeave: () => void
  }
}

/**
 * Tilts a dish with the phone's motion (gyroscope) or, failing that, with the
 * pointer/finger over it. The first gyroscope reading is taken as "level", so
 * however the person is holding the phone, the dish starts straight on.
 * Disabled entirely for people who prefer reduced motion.
 */
export function useTilt(active: boolean): Tilt {
  const reduce = useReducedMotion()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(rawX, { stiffness: 120, damping: 14, mass: 0.6 })
  const rotateY = useSpring(rawY, { stiffness: 120, damping: 14, mass: 0.6 })

  useEffect(() => {
    if (!active || reduce || permission !== 'granted') return
    let base: { beta: number; gamma: number } | null = null

    function onOrientation(e: DeviceOrientationEvent) {
      if (e.beta == null || e.gamma == null) return
      base ??= { beta: e.beta, gamma: e.gamma }
      rawX.set(clamp(-(e.beta - base.beta) * 0.6))
      rawY.set(clamp((e.gamma - base.gamma) * 0.6))
    }

    window.addEventListener('deviceorientation', onOrientation)
    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      rawX.set(0)
      rawY.set(0)
    }
  }, [active, reduce, rawX, rawY])

  return {
    rotateX,
    rotateY,
    bind: {
      onPointerMove: (e) => {
        // On a phone with the gyroscope on, the finger is busy swiping.
        if (reduce || (e.pointerType === 'touch' && permission === 'granted')) return
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        rawX.set(clamp(-py * MAX_TILT * 2))
        rawY.set(clamp(px * MAX_TILT * 2))
      },
      onPointerLeave: () => {
        rawX.set(0)
        rawY.set(0)
      },
    },
  }
}
