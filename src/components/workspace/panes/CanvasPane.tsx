import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Canvas from '../../Canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface CanvasPaneProps {
  canvasFileId: string
}

export default function CanvasPane({ canvasFileId }: CanvasPaneProps) {
  const { loadCanvasFile, editingProjectId, setEditingProjectId, updateCurrentCanvasFile } = useCanvasStore()

  // 当此 pane 获得焦点或 canvasFileId 变更时，保存旧画布并加载新画布
  useEffect(() => {
    if (editingProjectId !== canvasFileId) {
      // 先保存当前正在编辑的画布
      if (editingProjectId && editingProjectId !== '__new__') {
        updateCurrentCanvasFile()
      }
      loadCanvasFile(canvasFileId)
      setEditingProjectId(canvasFileId)
    }
  }, [canvasFileId, editingProjectId, loadCanvasFile, setEditingProjectId, updateCurrentCanvasFile])

  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <Canvas
          chatPanelOpen={false}
          onChatPanelToggle={() => {}}
          assetPanelOpen={false}
          onAssetPanelClose={() => {}}
          onAssetPanelToggle={() => {}}
        />
      </div>
    </ReactFlowProvider>
  )
}
