import { useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export interface TrendPoint {
  /** Short axis/tooltip label, e.g. "Jul 12". */
  label: string
  value: number
}

interface TrendChartProps {
  data: TrendPoint[]
  /** Any CSS colour (e.g. `var(--chart-1)`). */
  color: string
  /** Series name shown in the tooltip. */
  seriesLabel: string
  formatValue?: (n: number) => string
  height?: number
}

// viewBox geometry (scales to container width via preserveAspectRatio).
const W = 640
const ML = 6
const MR = 10
const MT = 10
const GRID_STEPS = 4

/** Round a max up to a friendly axis ceiling (1/2/5 × 10ⁿ). */
function niceMax(max: number): number {
  if (max <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(max))
  const frac = max / pow
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  return nice * pow
}

/**
 * Single-series area + line chart with recessive gridlines and a crosshair
 * tooltip (dataviz skill §interaction — an SVG chart ships hover by default).
 * One series ⇒ no legend; the title/toggle names it. Responsive by viewBox.
 */
export function TrendChart({
  data,
  color,
  seriesLabel,
  formatValue = (n) => String(n),
  height = 240,
}: TrendChartProps) {
  const gradientId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const MB = 24
  const H = height
  const plotLeft = ML
  const plotRight = W - MR
  const plotTop = MT
  const plotBottom = H - MB
  const plotW = plotRight - plotLeft
  const plotH = plotBottom - plotTop

  const n = data.length
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)))

  const xFor = (i: number) => (n <= 1 ? plotLeft + plotW / 2 : plotLeft + (plotW * i) / (n - 1))
  const yFor = (v: number) => plotTop + plotH * (1 - v / max)

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(d.value).toFixed(1)}`)
    .join(' ')
  const areaPath = `${linePath} L${xFor(n - 1).toFixed(1)},${plotBottom} L${xFor(0).toFixed(1)},${plotBottom} Z`

  // Sparse x labels: first, last, and a few in between.
  const labelEvery = Math.max(1, Math.ceil(n / 5))

  function handleMove(clientX: number) {
    const el = containerRef.current
    if (!el || n === 0) return
    const rect = el.getBoundingClientRect()
    const vx = ((clientX - rect.left) / rect.width) * W
    const t = Math.min(1, Math.max(0, (vx - plotLeft) / plotW))
    setActive(Math.round(t * (n - 1)))
  }

  return (
    <div className="relative select-none" ref={containerRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={`${seriesLabel} trend over ${n} days`}
        className="touch-pan-y overflow-visible"
        onPointerMove={(e) => handleMove(e.clientX)}
        onPointerDown={(e) => handleMove(e.clientX)}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines + y labels */}
        {Array.from({ length: GRID_STEPS + 1 }).map((_, i) => {
          const v = (max / GRID_STEPS) * (GRID_STEPS - i)
          const y = plotTop + (plotH * i) / GRID_STEPS
          return (
            <g key={i}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={y}
                y2={y}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={plotLeft + 2}
                y={y - 3}
                fontSize={11}
                fill="var(--text-muted)"
                className="tabular-nums"
              >
                {formatValue(Math.round(v))}
              </text>
            </g>
          )
        })}

        {/* Area + line */}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        {/* X labels */}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text
              key={i}
              x={xFor(i)}
              y={H - 7}
              fontSize={11}
              fill="var(--text-muted)"
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            >
              {d.label}
            </text>
          ) : null,
        )}

        {/* Crosshair */}
        {active !== null && data[active] && (
          <g>
            <line
              x1={xFor(active)}
              x2={xFor(active)}
              y1={plotTop}
              y2={plotBottom}
              stroke="var(--chart-axis)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={xFor(active)} cy={yFor(data[active].value)} r={5} fill="var(--surface)" />
            <circle
              cx={xFor(active)}
              cy={yFor(data[active].value)}
              r={4}
              fill={color}
              stroke="var(--surface)"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {active !== null && data[active] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-center shadow-medium"
          style={{ left: `${(xFor(active) / W) * 100}%` }}
        >
          <p className="text-small text-text-secondary">{data[active].label}</p>
          <p className="text-caption font-semibold text-foreground">
            <span
              className="mr-1 inline-block size-2 rounded-full align-middle"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {formatValue(data[active].value)} {seriesLabel.toLowerCase()}
          </p>
        </div>
      )}
    </div>
  )
}
