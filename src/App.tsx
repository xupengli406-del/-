import { Routes, Route, Navigate } from 'react-router-dom'
import { Component, type ReactNode, type ErrorInfo } from 'react'
import Dashboard from './pages/Dashboard'
import StudioIDE from './pages/StudioIDE'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#f87171', background: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>渲染错误</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fbbf24' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#9ca3af', marginTop: 12, fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* 第一层级：工作空间仪表盘 */}
        <Route path="/" element={<Dashboard />} />
        
        {/* 第二层级：工业化创作工作台 */}
        <Route path="/studio/:projectId" element={<StudioIDE />} />
        
        {/* 兜底重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
