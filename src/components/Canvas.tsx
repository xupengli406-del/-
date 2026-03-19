import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  SelectionMode,
  type NodeTypes,
  type Node,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useCanvasStore } from '../store/canvasStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import type { CharacterNodeData, SceneNodeData } from '../store/types'
import type { DocumentType } from '../store/workspaceTypes'
import TextNode from './nodes/TextNode'
import ImageNode from './nodes/ImageNode'
import VideoNode from './nodes/VideoNode'
import AudioNode from './nodes/AudioNode'
import StoryboardFrameNode from './nodes/StoryboardFrameNode'
import ScriptNode from './nodes/ScriptNode'
import CharacterNode from './nodes/CharacterNode'
import SceneNode from './nodes/SceneNode'
import MediaNode from './nodes/MediaNode'
import CanvasBottomBar from './panels/CanvasBottomBar'
import SelectionToolbar from './panels/SelectionToolbar'
import StoryboardImportModal from './panels/StoryboardImportModal'
import { Sparkles, FileUp, FileText } from 'lucide-react'

const nodeTypes: NodeTypes = {
  // 方案A 新节点类型
  scriptNode: ScriptNode,
  characterNode: CharacterNode,
  sceneNode: SceneNode,
  mediaNode: MediaNode,
  // 保留旧类型兼容
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  audioNode: AudioNode,
  storyboardFrameNode: StoryboardFrameNode,
}

interface CanvasProps {
  chatPanelOpen: boolean
  onChatPanelToggle: () => void
  assetPanelOpen: boolean
  onAssetPanelClose: () => void
  onAssetPanelToggle: () => void
}

export default function Canvas({ chatPanelOpen, onChatPanelToggle, assetPanelOpen, onAssetPanelClose, onAssetPanelToggle }: CanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    setSelectedNodeId,
    setSelectedNodeIds,
    setActiveFrame,
    setActiveCharacter,
    setActiveScene,
    updateCurrentCanvasFile,
    addScriptNode,
  } = useCanvasStore()
  const { openDocument } = useWorkspaceStore()

  const [showImportModal, setShowImportModal] = useState(false)

  // 自动保存：节点变化后延迟保存
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevNodesLenRef = useRef(nodes.length)

  useEffect(() => {
    // 跳过初始加载
    if (prevNodesLenRef.current === 0 && nodes.length === 0) return
    prevNodesLenRef.current = nodes.length

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      updateCurrentCanvasFile()
    }, 1000)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [nodes, updateCurrentCanvasFile])

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedNodeIds([])
    setActiveFrame(null)
    setActiveCharacter(null)
    setActiveScene(null)
  }, [setSelectedNodeId, setSelectedNodeIds, setActiveFrame, setActiveCharacter, setActiveScene])

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
      // 根据节点类型设置上下文
      if (node.type === 'storyboardFrameNode') {
        setActiveFrame(node.id)
        setActiveCharacter(null)
        setActiveScene(null)
      } else if (node.type === 'characterNode') {
        const charId = (node.data as CharacterNodeData).characterId
        setActiveCharacter(charId)
        setActiveFrame(null)
        setActiveScene(null)
      } else if (node.type === 'sceneNode') {
        const sceneId = (node.data as SceneNodeData).sceneId
        setActiveScene(sceneId)
        setActiveFrame(null)
        setActiveCharacter(null)
      } else {
        setActiveFrame(null)
        setActiveCharacter(null)
        setActiveScene(null)
      }
    },
    [setSelectedNodeId, setActiveFrame, setActiveCharacter, setActiveScene]
  )

  // 双击节点 → 在工作区中打开对应文档 tab
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const docTypeMap: Record<string, DocumentType> = {
        scriptNode: 'script',
        characterNode: 'character',
        sceneNode: 'scene',
        storyboardFrameNode: 'storyboardFrame',
        mediaNode: 'media',
      }
      const docType = docTypeMap[node.type || '']
      if (docType) {
        // 角色和场景用关联 ID（文件树中的 ID）
        let docId = node.id
        if (docType === 'character') {
          docId = (node.data as CharacterNodeData).characterId || node.id
        } else if (docType === 'scene') {
          docId = (node.data as SceneNodeData).sceneId || node.id
        }
        openDocument({ type: docType, id: docId })
      }
    },
    [openDocument]
  )

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      setSelectedNodeIds(selectedNodes.map((n) => n.id))
    },
    [setSelectedNodeIds]
  )

  const isEmpty = nodes.length === 0

  // edges 始终为空，提供空回调避免 React Flow v12 受控模式无限循环
  const handleEdgesChange = useCallback(() => {}, [])

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-apple-bg-secondary" tabIndex={0}>
      <div className="flex-1 relative min-w-0 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onPaneClick={handlePaneClick}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onSelectionChange={handleSelectionChange}
          zoomOnDoubleClick={false}
          panOnDrag={[1]}
          panOnScroll
          zoomOnScroll={false}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          nodeTypes={nodeTypes}
          connectOnClick={false}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          minZoom={0.1}
          maxZoom={4}
          deleteKeyCode={['Backspace', 'Delete']}
          className="bg-apple-bg-secondary"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d2d2d7" />
        </ReactFlow>

        {/* 空画布欢迎引导 */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
            <div className="text-center space-y-4 max-w-sm px-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand/20 flex items-center justify-center">
                  <Sparkles size={28} className="text-brand" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-apple-text mb-1.5">开始创作你的漫剧</h2>
                <p className="text-xs text-apple-text-tertiary leading-relaxed">
                  导入分镜脚本开始创作，或通过 AI 助手生成内容
                </p>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-full hover:bg-brand-dark transition-colors shadow-md"
                >
                  <FileUp size={16} />
                  导入分镜脚本
                </button>
                <button
                  onClick={() => {
                    const nodeId = addScriptNode({ title: '新剧本' })
                    openDocument({ type: 'script', id: nodeId })
                  }}
                  className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand text-sm font-medium rounded-full border border-brand/30 hover:bg-brand-50 transition-colors"
                >
                  <FileText size={16} />
                  创建剧本
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 选中工具栏 */}
        <SelectionToolbar />

        {/* 画布底部工具栏 */}
        <CanvasBottomBar />
      </div>

      {/* 分镜脚本导入弹窗 */}
      {showImportModal && (
        <StoryboardImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  )
}
