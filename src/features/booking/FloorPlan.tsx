import { useId, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { FloorArea, FloorTable } from './bookingTypes'
import { TABLE_TAGS } from './bookingTypes'

/**
 * A shop's area drawn as an illustrated, top-down scene — rooftop under a night
 * sky with fairy lights, a café floor with windows and pendant lamps, a garden,
 * a hall… — with every table in its real shape and a chair per seat.
 *
 * One component for all three uses: customers picking a table (`book`), the
 * owner arranging the plan (`edit`, drag to move) and the owner's day view.
 * 1 grid unit = 100 SVG units ≈ 1 metre.
 */
export type TableState = 'free' | 'booked' | 'selected' | 'small' | 'edit' | 'editSelected'

const U = 100

export const tableKey = (t: FloorTable) => t.id ?? t.key ?? t.label

interface FloorPlanProps {
  area: FloorArea
  mode?: 'book' | 'edit' | 'view'
  stateOf?: (t: FloorTable) => TableState
  onTableClick?: (t: FloorTable) => void
  /** Edit mode: a table dragged to a new spot (grid units). */
  onTableMove?: (key: string, x: number, y: number) => void
  className?: string
}

export function FloorPlan({ area, mode = 'book', stateOf, onTableClick, onTableMove, className = '' }: FloorPlanProps) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ key: string; dx: number; dy: number; moved: boolean } | null>(null)
  const W = area.width * U
  const H = area.height * U
  const kind = area.kind === 'unplaced' ? 'indoor' : area.kind

  function toGrid(e: ReactPointerEvent): { x: number; y: number } {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return { x: p.x / U, y: p.y / U }
  }

  function down(e: ReactPointerEvent, t: FloorTable) {
    if (mode !== 'edit') return
    const p = toGrid(e)
    drag.current = { key: tableKey(t), dx: p.x - (t.x ?? 1), dy: p.y - (t.y ?? 1), moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  function move(e: ReactPointerEvent) {
    const d = drag.current
    if (!d || mode !== 'edit') return
    const p = toGrid(e)
    const snap = (v: number) => Math.round(v * 10) / 10
    const x = Math.min(area.width - 0.4, Math.max(0.4, snap(p.x - d.dx)))
    const y = Math.min(area.height - 0.4, Math.max(0.4, snap(p.y - d.dy)))
    d.moved = true
    onTableMove?.(d.key, x, y)
  }
  function up() {
    drag.current = null
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={`block h-auto w-full touch-none select-none ${className}`}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={up}
      role="img"
      aria-label={`${area.name} floor plan`}
    >
      <style>{`
        @keyframes fp-twinkle-${uid}{0%,100%{opacity:.95}50%{opacity:.35}}
        @keyframes fp-pulse-${uid}{0%{transform:scale(1);opacity:.75}100%{transform:scale(1.5);opacity:0}}
        @keyframes fp-glow-${uid}{0%,100%{opacity:.55}50%{opacity:.9}}
        .fp-tw-${uid}{animation:fp-twinkle-${uid} 2.4s ease-in-out infinite}
        .fp-glow-${uid}{animation:fp-glow-${uid} 2.2s ease-in-out infinite}
        .fp-pulse-${uid}{transform-box:fill-box;transform-origin:center;animation:fp-pulse-${uid} 1.6s ease-out infinite}
        .fp-t-${uid}{transition:transform .25s cubic-bezier(.2,.9,.3,1.2)}
        .fp-hover-${uid}:hover .fp-lift-${uid}{transform:translateY(-4px)}
      `}</style>
      <Defs uid={uid} />
      <Scene kind={kind} W={W} H={H} uid={uid} />

      {/* Entrance marker */}
      <g transform={`translate(${W / 2} ${H - 26})`} opacity={0.9}>
        <rect x={-74} y={-16} width={148} height={30} rx={15} fill="rgba(0,0,0,.55)" />
        <text x={0} y={5} textAnchor="middle" fontSize={17} fontWeight={700} fill="#fff" letterSpacing={2}>
          ⬇ ENTRANCE
        </text>
      </g>

      {area.tables
        .filter((t) => t.x != null && t.y != null)
        .map((t) => {
          const state = stateOf?.(t) ?? (mode === 'edit' ? 'edit' : 'free')
          return (
            <Table
              key={tableKey(t)}
              t={t}
              state={state}
              uid={uid}
              dark={kind === 'rooftop' || kind === 'private'}
              clickable={mode !== 'view' || !!onTableClick}
              onClick={() => {
                if (drag.current?.moved) return
                if (state === 'booked' && mode === 'book') return
                onTableClick?.(t)
              }}
              onPointerDown={(e) => down(e, t)}
            />
          )
        })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Shared gradients, patterns, filters                                 */
/* ------------------------------------------------------------------ */
function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <filter id={`shadow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000" floodOpacity="0.35" />
      </filter>
      <filter id={`soft-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
      <radialGradient id={`lamp-${uid}`}>
        <stop offset="0%" stopColor="#fde68a" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`bulb-${uid}`}>
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="45%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c08457" />
        <stop offset="55%" stopColor="#9a6034" />
        <stop offset="100%" stopColor="#7c4a26" />
      </linearGradient>
      <linearGradient id={`marble-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#eef2f7" />
        <stop offset="100%" stopColor="#d9e0ea" />
      </linearGradient>
      <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f0c29" />
        <stop offset="55%" stopColor="#4c1d95" />
        <stop offset="100%" stopColor="#db2777" />
      </linearGradient>
      <pattern id={`deck-${uid}`} width="220" height="44" patternUnits="userSpaceOnUse">
        <rect width="220" height="44" fill="#4a3a31" />
        <rect y="0" width="220" height="21" fill="#54423a" />
        <line x1="0" y1="21.5" x2="220" y2="21.5" stroke="#2c211c" strokeWidth="2" />
        <line x1="0" y1="43.5" x2="220" y2="43.5" stroke="#2c211c" strokeWidth="2" />
        <line x1="140" y1="0" x2="140" y2="21" stroke="#2c211c" strokeWidth="2" />
        <line x1="60" y1="22" x2="60" y2="44" stroke="#2c211c" strokeWidth="2" />
      </pattern>
      <pattern id={`tile-${uid}`} width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="#f3e3cf" />
        <rect width="50" height="50" fill="#ead3b8" />
        <rect x="50" y="50" width="50" height="50" fill="#ead3b8" />
        <path d="M0 0H100V100H0Z" fill="none" stroke="#dcc2a3" strokeWidth="1.5" />
      </pattern>
      <pattern id={`grass-${uid}`} width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="#65b84a" />
        <path d="M8 50l3-12 3 12M30 22l3-12 3 12M46 54l2-10 2 10M18 18l2-9 2 9" stroke="#4e9a37" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </pattern>
      <pattern id={`parquet-${uid}`} width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="80" height="80" fill="#a8703f" />
        <rect width="40" height="80" fill="#b67c48" />
        <line x1="0" y1="40" x2="80" y2="40" stroke="#8a5a30" strokeWidth="2" />
        <line x1="40" y1="0" x2="40" y2="80" stroke="#8a5a30" strokeWidth="2" />
      </pattern>
      <pattern id={`carpet-${uid}`} width="90" height="90" patternUnits="userSpaceOnUse">
        <rect width="90" height="90" fill="#6b1d2e" />
        <path d="M45 10l35 35-35 35-35-35z" fill="none" stroke="#86283d" strokeWidth="3" />
        <circle cx="45" cy="45" r="5" fill="#a8334d" />
      </pattern>
      <pattern id={`terr-${uid}`} width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="#e7ddd2" />
        <path d="M0 0H120V120H0Z" fill="none" stroke="#d3c4b3" strokeWidth="2" />
        <path d="M60 0V120M0 60H120" stroke="#ddd0c1" strokeWidth="1.5" />
      </pattern>
    </defs>
  )
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */
function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="34" fill="#7c4a26" />
      <circle r="28" fill="#5b3418" />
      <circle cx="-12" cy="-8" r="20" fill="#2f855a" />
      <circle cx="12" cy="-6" r="22" fill="#38a169" />
      <circle cx="0" cy="10" r="20" fill="#276749" />
      <circle cx="6" cy="-14" r="10" fill="#68d391" opacity=".8" />
    </g>
  )
}

function Lights({ W, y, uid, sag = 60 }: { W: number; y: number; uid: string; sag?: number }) {
  const n = Math.max(6, Math.round(W / 110))
  const bulbs: ReactNode[] = []
  for (let i = 1; i < n; i++) {
    const t = i / n
    const bx = t * W
    const by = y + sag * 4 * t * (1 - t)
    bulbs.push(
      <g key={i} className={`fp-tw-${uid}`} style={{ animationDelay: `${(i % 5) * 0.4}s` }}>
        <circle cx={bx} cy={by} r={18} fill={`url(#bulb-${uid})`} />
        <circle cx={bx} cy={by} r={5} fill="#fffbeb" />
      </g>,
    )
  }
  return (
    <g>
      <path d={`M0 ${y} Q ${W / 2} ${y + sag * 2} ${W} ${y}`} fill="none" stroke="#1f1a17" strokeWidth={3} opacity={0.7} />
      {bulbs}
    </g>
  )
}

function Scene({ kind, W, H, uid }: { kind: string; W: number; H: number; uid: string }) {
  const r = 28
  switch (kind) {
    case 'rooftop': {
      const sky = 150
      const buildings: ReactNode[] = []
      let x = 0
      let i = 0
      while (x < W) {
        const w = 60 + ((i * 37) % 70)
        const h = 50 + ((i * 53) % 80)
        buildings.push(
          <g key={i}>
            <rect x={x} y={sky - h} width={w - 6} height={h} fill="#1e1b3a" />
            {Array.from({ length: Math.floor(h / 22) }).map((_, k) =>
              Array.from({ length: Math.floor((w - 14) / 16) }).map((__, m) =>
                (k * 7 + m * 3 + i) % 3 !== 0 ? (
                  <rect key={`${k}-${m}`} x={x + 6 + m * 16} y={sky - h + 8 + k * 22} width={7} height={9} fill="#fcd34d" opacity={0.75} />
                ) : null,
              ),
            )}
          </g>,
        )
        x += w
        i++
      }
      return (
        <g>
          <rect width={W} height={H} rx={r} fill={`url(#deck-${uid})`} />
          <rect width={W} height={sky + 10} fill={`url(#sky-${uid})`} rx={r} />
          {Array.from({ length: 18 }).map((_, k) => (
            <circle key={k} className={`fp-tw-${uid}`} style={{ animationDelay: `${k * 0.3}s` }} cx={(k * 173) % W} cy={12 + ((k * 41) % 60)} r={k % 4 === 0 ? 3 : 1.8} fill="#fff" />
          ))}
          <circle cx={W - 90} cy={48} r={26} fill="#fef3c7" />
          <circle cx={W - 80} cy={42} r={24} fill="#4c1d95" opacity={0.35} />
          {buildings}
          {/* Parapet */}
          <rect x={0} y={sky} width={W} height={14} fill="#cbbfb2" />
          <rect x={0} y={H - 14} width={W} height={14} fill="#cbbfb2" rx={6} />
          <rect x={0} y={sky} width={14} height={H - sky} fill="#cbbfb2" />
          <rect x={W - 14} y={sky} width={14} height={H - sky} fill="#cbbfb2" />
          <Lights W={W} y={sky + 26} uid={uid} sag={50} />
          <Plant x={60} y={sky + 70} s={1.1} />
          <Plant x={W - 60} y={sky + 70} s={1.1} />
          <Plant x={60} y={H - 70} />
          <Plant x={W - 60} y={H - 70} />
        </g>
      )
    }
    case 'garden':
      return (
        <g>
          <rect width={W} height={H} rx={r} fill={`url(#grass-${uid})`} />
          <path d={`M${W / 2 - 60} ${H} C ${W / 2 - 40} ${H * 0.6}, ${W / 2 + 80} ${H * 0.5}, ${W / 2 + 40} 0 L ${W / 2 + 130} 0 C ${W / 2 + 160} ${H * 0.5}, ${W / 2 + 50} ${H * 0.62}, ${W / 2 + 60} ${H} Z`} fill="#d6c7a8" opacity={0.75} />
          {[
            [70, 70, 1.6],
            [W - 80, 80, 1.8],
            [80, H - 90, 1.4],
            [W - 90, H - 100, 1.5],
            [W / 2 - 220, 60, 1.2],
          ].map(([x, y, s], k) => (
            <g key={k} transform={`translate(${x} ${y}) scale(${s})`} filter={`url(#shadow-${uid})`}>
              <circle r="40" fill="#22543d" />
              <circle cx="-14" cy="-10" r="26" fill="#2f855a" />
              <circle cx="16" cy="-4" r="24" fill="#38a169" />
              <circle cx="0" cy="14" r="22" fill="#276749" />
            </g>
          ))}
          <Lights W={W} y={40} uid={uid} sag={40} />
        </g>
      )
    case 'hall':
      return (
        <g>
          <rect width={W} height={H} rx={r} fill={`url(#parquet-${uid})`} />
          <rect x={W * 0.2} y={0} width={W * 0.6} height={110} fill="#7f1d1d" rx={10} />
          {Array.from({ length: 12 }).map((_, k) => (
            <rect key={k} x={W * 0.2 + (k * W * 0.6) / 12} y={0} width={(W * 0.6) / 24} height={110} fill="#991b1b" />
          ))}
          <rect x={W * 0.25} y={96} width={W * 0.5} height={30} rx={8} fill="#fbbf24" opacity={0.85} />
          <text x={W / 2} y={117} textAnchor="middle" fontSize={20} fontWeight={800} fill="#7c2d12" letterSpacing={3}>STAGE</text>
          {[0.25, 0.5, 0.75].map((f) =>
            [0.45, 0.75].map((g) => (
              <g key={`${f}-${g}`} className={`fp-glow-${uid}`}>
                <circle cx={W * f} cy={H * g} r={120} fill={`url(#lamp-${uid})`} />
              </g>
            )),
          )}
        </g>
      )
    case 'private':
      return (
        <g>
          <rect width={W} height={H} rx={r} fill={`url(#carpet-${uid})`} />
          <rect x={10} y={10} width={W - 20} height={H - 20} rx={r - 6} fill="none" stroke="#d4a373" strokeWidth={6} opacity={0.7} />
          {Array.from({ length: Math.ceil(W / 60) }).map((_, k) => (
            <path key={k} d={`M${k * 60} 0 q 30 70 60 0 v 70 h -60 z`} fill={k % 2 ? '#7f1d1d' : '#991b1b'} opacity={0.9} />
          ))}
          <g className={`fp-glow-${uid}`}>
            <circle cx={W / 2} cy={H / 2} r={Math.min(W, H) / 2.2} fill={`url(#lamp-${uid})`} opacity={0.5} />
          </g>
        </g>
      )
    case 'terrace':
      return (
        <g>
          <rect width={W} height={H} rx={r} fill={`url(#terr-${uid})`} />
          <rect x={0} y={0} width={W} height={24} fill="#94a3b8" />
          {Array.from({ length: Math.ceil(W / 40) }).map((_, k) => (
            <rect key={k} x={k * 40 + 10} y={0} width={6} height={24} fill="#64748b" />
          ))}
          {[
            [90, 110],
            [W - 100, 120],
          ].map(([x, y], k) => (
            <g key={k} transform={`translate(${x} ${y})`} filter={`url(#shadow-${uid})`}>
              {Array.from({ length: 8 }).map((_, m) => (
                <path key={m} d={`M0 0 L ${70 * Math.cos((m * Math.PI) / 4)} ${70 * Math.sin((m * Math.PI) / 4)} A 70 70 0 0 1 ${70 * Math.cos(((m + 1) * Math.PI) / 4)} ${70 * Math.sin(((m + 1) * Math.PI) / 4)} Z`} fill={m % 2 ? '#fb923c' : '#fff7ed'} />
              ))}
              <circle r="6" fill="#7c2d12" />
            </g>
          ))}
          <Plant x={60} y={H - 70} />
          <Plant x={W - 60} y={H - 70} />
        </g>
      )
    default: {
      // Café / dining floor
      return (
        <g>
          <rect width={W} height={H} rx={r} fill={`url(#tile-${uid})`} />
          {/* Back wall with windows */}
          <rect x={0} y={0} width={W} height={46} fill="#7c5a43" rx={r} />
          {Array.from({ length: Math.max(2, Math.floor(W / 260)) }).map((_, k, arr) => {
            const ww = 170
            const gap = (W - arr.length * ww) / (arr.length + 1)
            const x = gap + k * (ww + gap)
            return (
              <g key={k}>
                <rect x={x} y={8} width={ww} height={34} rx={5} fill="#bae6fd" stroke="#f8fafc" strokeWidth={5} />
                <line x1={x + ww / 2} y1={8} x2={x + ww / 2} y2={42} stroke="#f8fafc" strokeWidth={4} />
                <path d={`M${x + 14} 38 L ${x + 50} 12`} stroke="#fff" strokeWidth={4} opacity={0.6} />
              </g>
            )
          })}
          {/* Counter */}
          <g filter={`url(#shadow-${uid})`}>
            <rect x={W - 250} y={H - 92} width={210} height={58} rx={14} fill="#5b3a29" />
            <rect x={W - 244} y={H - 86} width={198} height={14} rx={7} fill="#7c5a43" />
          </g>
          <text x={W - 145} y={H - 46} textAnchor="middle" fontSize={22}>☕ 🧁 🍰</text>
          {/* Pendant lights */}
          {Array.from({ length: Math.max(2, Math.floor(W / 320)) }).map((_, k, arr) => (
            <g key={k} className={`fp-glow-${uid}`} style={{ animationDelay: `${k * 0.5}s` }}>
              <circle cx={((k + 1) * W) / (arr.length + 1)} cy={H * 0.45} r={150} fill={`url(#lamp-${uid})`} opacity={0.55} />
            </g>
          ))}
          <Plant x={50} y={90} s={0.9} />
          <Plant x={W - 50} y={90} s={0.9} />
          <Plant x={50} y={H - 60} s={0.9} />
        </g>
      )
    }
  }
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */
interface Geo {
  top: ReactNode
  chairs: { x: number; y: number; r: number }[]
  w: number
  h: number
}

function geometry(t: FloorTable, fill: string, stroke: string): Geo {
  const seats = Math.max(1, t.seats)
  const chair = (x: number, y: number, r: number) => ({ x, y, r })
  switch (t.shape) {
    case 'couple': {
      return { top: <circle r={40} fill={fill} stroke={stroke} strokeWidth={3} />, chairs: [chair(-66, 0, 90), chair(66, 0, -90)], w: 170, h: 90 }
    }
    case 'round': {
      const R = Math.min(105, 42 + seats * 7)
      const cr = R + 28
      return {
        top: <circle r={R} fill={fill} stroke={stroke} strokeWidth={3} />,
        chairs: Array.from({ length: seats }).map((_, i) => {
          const a = (i / seats) * Math.PI * 2 - Math.PI / 2
          return chair(Math.cos(a) * cr, Math.sin(a) * cr, (a * 180) / Math.PI + 90)
        }),
        w: cr * 2 + 40,
        h: cr * 2 + 40,
      }
    }
    case 'rect': {
      const perSide = Math.ceil(seats / 2)
      const L = Math.max(150, perSide * 66)
      const Hh = 84
      const chairs = []
      for (let i = 0; i < perSide; i++) {
        const x = -L / 2 + (L / perSide) * (i + 0.5)
        chairs.push(chair(x, -Hh / 2 - 26, 0))
        if (chairs.length < seats) chairs.push(chair(x, Hh / 2 + 26, 180))
      }
      return { top: <rect x={-L / 2} y={-Hh / 2} width={L} height={Hh} rx={14} fill={fill} stroke={stroke} strokeWidth={3} />, chairs, w: L + 40, h: Hh + 110 }
    }
    case 'booth': {
      const L = Math.max(120, Math.ceil(seats / 2) * 60)
      return {
        top: (
          <g>
            <rect x={-L / 2 - 8} y={-88} width={L + 16} height={40} rx={18} fill="#9f1239" />
            <rect x={-L / 2 - 8} y={48} width={L + 16} height={40} rx={18} fill="#9f1239" />
            <rect x={-L / 2 - 8} y={-88} width={L + 16} height={14} rx={7} fill="#be123c" />
            <rect x={-L / 2 - 8} y={74} width={L + 16} height={14} rx={7} fill="#be123c" />
            <rect x={-L / 2} y={-40} width={L} height={80} rx={14} fill={fill} stroke={stroke} strokeWidth={3} />
          </g>
        ),
        chairs: [],
        w: L + 40,
        h: 190,
      }
    }
    default: {
      // square: one chair per side, two per side above 4 seats
      const S = seats > 4 ? 120 : 92
      const chairs: { x: number; y: number; r: number }[] = []
      const sides = [
        [0, -1, 0],
        [1, 0, 90],
        [0, 1, 180],
        [-1, 0, 270],
      ] as const
      for (let i = 0; i < seats; i++) {
        const [sx, sy, rot] = sides[i % 4]
        const pair = seats > 4 ? (Math.floor(i / 4) === 0 ? -24 : 24) : 0
        const off = S / 2 + 26
        chairs.push(chair(sx * off + (sy !== 0 ? pair : 0), sy * off + (sx !== 0 ? pair : 0), rot))
      }
      return { top: <rect x={-S / 2} y={-S / 2} width={S} height={S} rx={14} fill={fill} stroke={stroke} strokeWidth={3} />, chairs, w: S + 110, h: S + 110 }
    }
  }
}

function Table({
  t,
  state,
  uid,
  dark,
  clickable,
  onClick,
  onPointerDown,
}: {
  t: FloorTable
  state: TableState
  uid: string
  dark: boolean
  clickable: boolean
  onClick: () => void
  onPointerDown: (e: ReactPointerEvent) => void
}) {
  const booked = state === 'booked'
  const selected = state === 'selected' || state === 'editSelected'
  const small = state === 'small'
  const topFill = booked ? '#9ca3af' : t.shape === 'round' || t.shape === 'couple' ? `url(#marble-${uid})` : `url(#wood-${uid})`
  const stroke = selected ? '#f59e0b' : booked ? '#6b7280' : dark ? '#e7e5e4' : '#5b3418'
  const chairFill = booked ? '#d1d5db' : selected ? '#fbbf24' : state === 'free' ? '#ecfdf5' : '#fff7ed'
  const chairStroke = booked ? '#9ca3af' : selected ? '#b45309' : state === 'free' ? '#10b981' : '#c2410c'
  const g = geometry(t, topFill, stroke)
  const tagEmojis = t.tags
    .map((tag) => TABLE_TAGS.find((x) => x.value === tag)?.emoji)
    .filter(Boolean)
    .slice(0, 3)
  const ring = Math.max(g.w, g.h) / 2

  return (
    <g
      transform={`translate(${(t.x ?? 1) * U} ${(t.y ?? 1) * U})`}
      className={`fp-hover-${uid}`}
      style={{ cursor: booked ? 'not-allowed' : clickable ? (state === 'edit' || state === 'editSelected' ? 'grab' : 'pointer') : 'default' }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      opacity={small ? 0.55 : 1}
      role={clickable ? 'button' : undefined}
      aria-label={`${t.label}, ${t.seats} seats${booked ? ', booked' : selected ? ', selected' : ''}`}
    >
      {/* Free / selected glow */}
      {state === 'free' && <circle r={ring} fill="#10b981" opacity={0.12} />}
      {selected && (
        <>
          <circle r={ring} fill="#f59e0b" opacity={0.22} />
          <circle r={ring} fill="none" stroke="#f59e0b" strokeWidth={6} className={`fp-pulse-${uid}`} />
        </>
      )}
      <g className={`fp-t-${uid} fp-lift-${uid}`}>
        <g transform={`rotate(${t.rotation})`} filter={`url(#shadow-${uid})`}>
          {g.chairs.map((c, i) => (
            <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.r})`}>
              <rect x={-20} y={-17} width={40} height={34} rx={10} fill={chairFill} stroke={chairStroke} strokeWidth={3} />
              <rect x={-18} y={-17} width={36} height={9} rx={4} fill={chairStroke} opacity={0.55} />
            </g>
          ))}
          {g.top}
          {/* Little table setting */}
          {!booked && t.shape !== 'booth' && (
            <g opacity={0.9}>
              <circle r={9} fill="#fff" stroke="#e5e7eb" strokeWidth={2} />
              {t.tags.includes('candle-light') && (
                <g className={`fp-tw-${uid}`}>
                  <circle r={22} fill={`url(#bulb-${uid})`} />
                </g>
              )}
            </g>
          )}
        </g>
        {/* Label pill */}
        <g transform="translate(0 4)">
          <rect x={-40} y={-18} width={80} height={34} rx={17} fill={booked ? '#4b5563' : selected ? '#f59e0b' : '#111827'} opacity={0.92} />
          <text x={0} y={5} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff">
            {t.label} · {t.seats}
          </text>
        </g>
        {tagEmojis.length > 0 && (
          <g transform={`translate(0 ${-ring - 4})`}>
            <rect x={-(tagEmojis.length * 15 + 8)} y={-20} width={tagEmojis.length * 30 + 16} height={32} rx={16} fill="rgba(255,255,255,.92)" />
            <text x={0} y={4} textAnchor="middle" fontSize={20}>
              {tagEmojis.join(' ')}
            </text>
          </g>
        )}
        {booked && (
          <g transform={`translate(0 ${ring - 14})`}>
            <rect x={-44} y={-14} width={88} height={26} rx={13} fill="#ef4444" />
            <text x={0} y={5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#fff" letterSpacing={1}>
              BOOKED
            </text>
          </g>
        )}
        {selected && (
          <g transform={`translate(${ring * 0.62} ${-ring * 0.62})`}>
            <circle r={18} fill="#f59e0b" stroke="#fff" strokeWidth={4} />
            <path d="M-8 0 l5 6 l11 -12" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {t.active === false && (
          <text x={0} y={ring - 6} textAnchor="middle" fontSize={14} fontWeight={700} fill="#b91c1c">
            hidden
          </text>
        )}
      </g>
    </g>
  )
}

/** Little legend shown under the plan. */
export function FloorLegend() {
  const item = (color: string, ring: string, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-3.5 rounded-full border-2" style={{ background: color, borderColor: ring }} />
      {label}
    </span>
  )
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-secondary">
      {item('#ecfdf5', '#10b981', 'Free')}
      {item('#fbbf24', '#b45309', 'Your table')}
      {item('#d1d5db', '#9ca3af', 'Booked')}
      <span>🪟 window · 🌆 view · 🕯️ candle-light · ❤️ couple</span>
    </div>
  )
}
