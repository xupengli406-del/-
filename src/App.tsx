import { Component, lazy, Suspense, useEffect, useState, type ReactNode, type ErrorInfo } from 'react'
import WorkspaceShell from './components/workspace/WorkspaceShell'
import { useProjectStore } from './store/projectStore'
import { useWorkspaceStore } from './store/workspaceStore'
import { useAccountStore } from './store/accountStore'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const BetaGatePage = lazy(() => import('./pages/BetaGatePage'))

const BETA_AUTH_KEY = 'cloudsvid_beta_auth'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#e53e3e', background: '#fff', minHeight: '100vh', fontFamily: '-apple-system, sans-serif' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16, fontWeight: 600 }}>渲染错误</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#c53030' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#a0aec0', marginTop: 12, fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function MainLayout() {
  const { initializeFromBackend } = useProjectStore()
  const { openDocument } = useWorkspaceStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      await initializeFromBackend()

      if (import.meta.env.DEV) {
        ;(window as any).__stores = {
          account: useAccountStore,
          workspace: useWorkspaceStore,
          project: useProjectStore,
        }
      }

      const params = new URLSearchParams(window.location.search)
      const docType = params.get('docType')
      const docId = params.get('docId')
      if (docType && docId) {
        const allowedTypes = new Set(['imageGeneration', 'videoGeneration', 'welcome'])
        if (allowedTypes.has(docType)) {
          openDocument({ type: docType as any, id: docId })
        }
      }

      setReady(true)
    }
    init()
  }, [initializeFromBackend, openDocument])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-apple-text-tertiary">加载中...</span>
        </div>
      </div>
    )
  }

  return <WorkspaceShell />
}

function AppRoute() {
  const [betaAuthed, setBetaAuthed] = useState(() => sessionStorage.getItem(BETA_AUTH_KEY) === '1')

  const handleBetaEnter = () => {
    sessionStorage.setItem(BETA_AUTH_KEY, '1')
    setBetaAuthed(true)
  }

  if (betaAuthed) {
    return <MainLayout />
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen" style={{ background: '#F8FAFC' }}>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }} />
        </div>
      }
    >
      <BetaGatePage onEnter={handleBetaEnter} />
    </Suspense>
  )
}

const isLandingPage = window.location.pathname === '/' || window.location.pathname === ''

export default function App() {
  return (
    <ErrorBoundary>
      {isLandingPage ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen" style={{ background: '#F8FAFC' }}>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }} />
            </div>
          }
        >
          <LandingPage />
        </Suspense>
      ) : (
        <AppRoute />
      )}
    </ErrorBoundary>
  )
}
