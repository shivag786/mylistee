import { useId } from 'react'

interface SparklineProps {
  /** Series values, oldest → newest. */
  values: number[]
  /** Any CSS colour (e.g. `var(--chart-1)`). Defaults to currentColor. */
  color?: string
  width?: number
  height?: number
  className?: string
}

/**
 * Minimal inline-SVG sparkline — a line + soft area fill, no axes (dataviz
 * skill §choosing-a-form: a trend glyph for a stat tile). Decorative context for
 * a KPI value; the number beside it carries the meaning, so it's aria-hidden.
 */
export function Sparkline({
  values,
  color = 'currentColor',
  width = 96,
  height = 28,
  className,
}: SparklineProps) {
  const gradientId = useId()

  if (values.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden />
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const stepX = width / (values.length - 1)
  const pad = 2

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = pad + (height - pad * 2) * (1 - (v - min) / span)
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
