import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ImagePreferences {
  model: string
  ratio: string
  resolution: string
  promptOptimize: boolean
  sequentialGeneration: boolean
  maxImages: number
  outputFormat: 'jpeg' | 'png'
}

interface VideoPreferences {
  model: string
  length: number
  ratio: string
  refMode: string
  resolution: string
}

interface EditorPreferencesState {
  image: ImagePreferences
  video: VideoPreferences
  updateImagePref: (updates: Partial<ImagePreferences>) => void
  updateVideoPref: (updates: Partial<VideoPreferences>) => void
}

export const useEditorPreferencesStore = create<EditorPreferencesState>()(
  persist(
    (set) => ({
      image: { model: '', ratio: '1:1', resolution: '2K', promptOptimize: true, sequentialGeneration: false, maxImages: 4, outputFormat: 'jpeg' as const },
      video: { model: '', length: 5, ratio: '16:9', refMode: 'both', resolution: '720P' },

      updateImagePref: (updates) =>
        set((s) => ({ image: { ...s.image, ...updates } })),
      updateVideoPref: (updates) =>
        set((s) => ({ video: { ...s.video, ...updates } })),
    }),
    {
      name: 'editor-preferences',
      partialize: (state) => ({
        image: state.image,
        video: state.video,
      }),
    },
  ),
)
