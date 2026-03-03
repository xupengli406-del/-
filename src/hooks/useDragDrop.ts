import { useState, useCallback, useRef } from 'react'
import type { Character, Environment } from '../store/types'

export interface DragData {
  type: 'character' | 'environment' | 'prop'
  data: Character | Environment
}

export interface DropZone {
  id: string
  rect: DOMRect
  onDrop: (data: DragData) => void
}

export function useDragDrop() {
  const [isDragging, setIsDragging] = useState(false)
  const [dragData, setDragData] = useState<DragData | null>(null)
  const dropZonesRef = useRef<Map<string, DropZone>>(new Map())

  const startDrag = useCallback((data: DragData) => {
    setIsDragging(true)
    setDragData(data)
  }, [])

  const endDrag = useCallback(() => {
    setIsDragging(false)
    setDragData(null)
  }, [])

  const registerDropZone = useCallback((zone: DropZone) => {
    dropZonesRef.current.set(zone.id, zone)
    return () => {
      dropZonesRef.current.delete(zone.id)
    }
  }, [])

  const handleDrop = useCallback((zoneId: string, data: DragData) => {
    const zone = dropZonesRef.current.get(zoneId)
    if (zone) {
      zone.onDrop(data)
    }
    endDrag()
  }, [endDrag])

  return {
    isDragging,
    dragData,
    startDrag,
    endDrag,
    registerDropZone,
    handleDrop,
  }
}

export function useDraggable<T extends HTMLElement>(data: DragData) {
  const handleDragStart = useCallback((e: React.DragEvent<T>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'copy'
    
    const dragImage = document.createElement('div')
    dragImage.className = 'fixed pointer-events-none bg-violet-500/90 text-white px-3 py-2 rounded-lg text-sm shadow-lg'
    dragImage.textContent = data.data.name
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    requestAnimationFrame(() => {
      document.body.removeChild(dragImage)
    })
  }, [data])

  return {
    draggable: true,
    onDragStart: handleDragStart,
  }
}

export function useDroppable<T extends HTMLElement>(onDrop: (data: DragData) => void) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault()
    setIsOver(false)
    
    try {
      const jsonData = e.dataTransfer.getData('application/json')
      if (jsonData) {
        const data = JSON.parse(jsonData) as DragData
        onDrop(data)
      }
    } catch (error) {
      console.error('Drop parse error:', error)
    }
  }, [onDrop])

  return {
    isOver,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }
}
