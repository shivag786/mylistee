import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * A small Markdown renderer for CMS pages: headings (##, ###), paragraphs,
 * bullet and numbered lists, tables, rules, **bold**, *italic*, `code` and
 * [links](/p/terms). It builds React elements — never HTML strings — so
 * whatever the admin types cannot inject script into the page.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return <div className={className ?? 'space-y-3'}>{blocks(source.replace(/\r\n/g, '\n'))}</div>
}

function blocks(src: string): ReactNode[] {
  const lines = src.split('\n')
  const out: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()

    if (t === '') {
      i++
      continue
    }

    const h = /^(#{1,4})\s+(.*)$/.exec(t)
    if (h) {
      const level = h[1].length
      const text = inline(h[2])
      out.push(
        level <= 2 ? (
          <h2 key={key++} className="pt-2 text-body-lg font-semibold text-foreground">{text}</h2>
        ) : (
          <h3 key={key++} className="pt-1 text-body font-semibold text-foreground">{text}</h3>
        ),
      )
      i++
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(t)) {
      out.push(<hr key={key++} className="border-border" />)
      i++
      continue
    }

    // Table: a header row, a |---| separator, then rows.
    if (t.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const head = cells(t)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]))
      out.push(
        <div key={key++} className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-caption">
            <thead className="bg-surface-muted text-foreground">
              <tr>
                {head.map((c, k) => (
                  <th key={k} className="px-3 py-2 font-semibold">{inline(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {rows.map((r, k) => (
                <tr key={k}>
                  {r.map((c, n) => (
                    <td key={n} className="px-3 py-2 align-top">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    const bullet = /^[-*]\s+/
    const numbered = /^\d+[.)]\s+/
    if (bullet.test(t) || numbered.test(t)) {
      const ordered = numbered.test(t)
      const re = ordered ? numbered : bullet
      const items: string[] = []
      while (i < lines.length && re.test(lines[i].trim())) {
        let item = lines[i].trim().replace(re, '')
        i++
        // Continuation lines (indented, not a new item).
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i].trim())) item += ' ' + lines[i++].trim()
        items.push(item)
      }
      const List = ordered ? 'ol' : 'ul'
      out.push(
        <List
          key={key++}
          className={`${ordered ? 'list-decimal' : 'list-disc'} space-y-1.5 pl-5 text-caption leading-relaxed text-text-secondary`}
        >
          {items.map((it, k) => (
            <li key={k}>{inline(it)}</li>
          ))}
        </List>,
      )
      continue
    }

    // Paragraph: consecutive non-blank lines that start nothing else. A line
    // break inside it is kept (FAQ question / answer pairs).
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4}\s|[-*]\s|\d+[.)]\s|\|)/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim())
      i++
    }
    out.push(
      <p key={key++} className="text-caption leading-relaxed text-text-secondary">
        {para.map((p, k) => (
          <Fragment key={k}>
            {k > 0 && <br />}
            {inline(p)}
          </Fragment>
        ))}
      </p>,
    )
  }
  return out
}

/** **bold**, *italic* / _italic_, `code`, [text](url) */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2] !== undefined) out.push(<strong key={k++} className="font-semibold text-foreground">{m[2]}</strong>)
    else if (m[3] !== undefined) out.push(<MdLink key={k++} href={m[4]}>{m[3]}</MdLink>)
    else if (m[5] !== undefined) out.push(<code key={k++} className="rounded bg-surface-muted px-1">{m[5]}</code>)
    else out.push(<em key={k++}>{m[6] ?? m[7]}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function MdLink({ href, children }: { href: string; children: ReactNode }) {
  const cls = 'font-medium text-primary underline'
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={cls}>
        {children}
      </Link>
    )
  }
  // Only web and mail links; anything else (javascript:, data:) renders as text.
  if (!/^(https?:|mailto:|tel:)/i.test(href)) return <>{children}</>
  return (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}
