import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence for render errors. Without one, any throw unmounts the
 * whole tree and leaves a blank page with no way back — the browser's Back
 * button doesn't help because the URL never changed.
 *
 * A failed lazy-route chunk lands here too. That usually means a deploy
 * replaced the hashed bundles this tab still points at, so reloading fetches
 * the current index.html and fixes it; `reloadedOnce` stops that from looping
 * when the real cause is a genuine render bug.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)

    if (isChunkLoadError(error) && !sessionStorage.getItem('listee:reloadedOnce')) {
      try {
        sessionStorage.setItem('listee:reloadedOnce', '1')
      } catch {
        // Private mode / storage disabled — skip the auto-reload, show the UI.
        return
      }
      window.location.reload()
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-title font-bold text-foreground">Something went wrong</h1>
        <p className="max-w-sm text-caption text-text-secondary">
          The page didn&apos;t load properly. Reloading usually fixes it.
        </p>
        <Button
          onClick={() => {
            try {
              sessionStorage.removeItem('listee:reloadedOnce')
            } catch {
              // Ignore — the reload below is what matters.
            }
            window.location.reload()
          }}
        >
          <RefreshCw className="size-4" aria-hidden /> Reload
        </Button>
      </div>
    )
  }
}

/** A dynamic import that failed — stale chunk reference, or the network died. */
function isChunkLoadError(error: Error): boolean {
  const text = `${error.name} ${error.message}`
  return (
    /ChunkLoadError/i.test(text) ||
    /Loading chunk .* failed/i.test(text) ||
    /Failed to fetch dynamically imported module/i.test(text) ||
    /error loading dynamically imported module/i.test(text) ||
    /Importing a module script failed/i.test(text)
  )
}
