import { Component, useEffect, useState, type ReactNode, type ErrorInfo } from 'react'
import WorkspaceShell from './components/workspace/WorkspaceShell'
import { useCanvasStore } from './store/canvasStore'
import { useWorkspaceStore } from './store/workspaceStore'

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
  const { initializeFromBackend, loadCanvasFile } = useCanvasStore()
  const { openDocument } = useWorkspaceStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      await initializeFromBackend()

      // URL 参数兼容: ?mode=canvas&project=xxx 或 ?docType=imageGeneration&docId=xxx
      const params = new URLSearchParams(window.location.search)
      if (params.get('mode') === 'canvas') {
        const projectId = params.get('project')
        if (projectId) {
          loadCanvasFile(projectId)
          openDocument({ type: 'canvas', id: projectId })
        }
      }

      const docType = params.get('docType')
      const docId = params.get('docId')
      if (docType && docId) {
        const allowedTypes = new Set(['canvas', 'script', 'character', 'scene', 'storyboardFrame', 'media', 'imageGeneration', 'videoGeneration', 'welcome'])
        if (allowedTypes.has(docType)) {
          loadCanvasFile(docId)
          openDocument({ type: docType as any, id: docId })
        }
      }

      setReady(true)
    }
    init()
  }, [initializeFromBackend, loadCanvasFile, openDocument])

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

export default function App() {
  return (
    <ErrorBoundary>
      <MainLayout />
    </ErrorBoundary>
  )
}
