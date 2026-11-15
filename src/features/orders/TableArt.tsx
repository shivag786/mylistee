/**
 * A table seen from above with one chair per seat around it. Unknown seats
 * draw 4 chairs. Uses `currentColor`, so it takes the text colour around it.
 */
export function TableArt({ seats, label, className = 'size-full' }: { seats?: number | null; label?: string; className?: string }) {
  const n = Math.min(12, Math.max(1, seats ?? 4))
  const short = label ? (label.length <= 3 ? label : (label.match(/\d+/g) ?? []).join('')) : ''
  const chairW = n > 8 ? 13 : 17
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const deg = -90 + (i * 360) / n
        const a = (deg * Math.PI) / 180
        const x = 50 + 39 * Math.cos(a)
        const y = 50 + 39 * Math.sin(a)
        return (
          <rect
            key={i}
            x={x - chairW / 2}
            y={y - 5}
            width={chairW}
            height={10}
            rx={5}
            fill="currentColor"
            opacity={0.9}
            transform={`rotate(${deg + 90} ${x} ${y})`}
          />
        )
      })}
      <circle cx="50" cy="50" r="25" fill="currentColor" fillOpacity={0.22} stroke="currentColor" strokeWidth={3.5} />
      {short && (
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="900" fill="currentColor">
          {short}
        </text>
      )}
    </svg>
  )
}
