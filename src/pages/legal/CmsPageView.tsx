import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import { Spinner } from '@/components/feedback/Spinner'
import { LegalPage } from '@/components/legal/LegalPage'
import { Markdown } from '@/components/legal/Markdown'
import { NotFoundPage } from '@/pages/NotFoundPage'

interface PublicPage {
  slug: string
  title: string
  body: string | null
  updatedAt: string | null
}

/**
 * A page the admin writes in CMS pages (Privacy, Terms, Delete account…),
 * shown standalone for a signed-out visitor — Play Store and payment
 * providers open these links cold. `fallback` is the built-in copy, used if
 * the page cannot be loaded, so a policy link never shows an error.
 */
export function CmsPageView({ slug: fixed, fallback }: { slug?: string; fallback?: ReactNode }) {
  const params = useParams<{ slug: string }>()
  const slug = fixed ?? params.slug ?? ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pages', slug],
    queryFn: () => apiClient.get<PublicPage>(`pages/${slug}`),
    enabled: slug !== '',
    staleTime: 5 * 60_000,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={28} label="Loading page" />
      </div>
    )
  }
  if (isError || !data || !data.body?.trim()) {
    return fallback ? <>{fallback}</> : <NotFoundPage />
  }

  // A leading "**In short:** …" paragraph becomes the page summary.
  const body = data.body.trim()
  const short = /^\*\*In short:\*\*\s*(.+?)(\n\s*\n|$)/s.exec(body)

  return (
    <LegalPage
      title={data.title}
      summary={short ? short[1].replace(/\*\*/g, '') : ''}
      lastUpdated={
        data.updatedAt
          ? new Date(data.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
          : undefined
      }
    >
      <Markdown source={short ? body.slice(short[0].length) : body} />
    </LegalPage>
  )
}
