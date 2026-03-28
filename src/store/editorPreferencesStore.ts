import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ImagePreferences {
  model: string
  ratio: string
  resolution: string
  batch: number
}

interface VideoPreferences {
  model: string
  length: number
  ratio: string
  refMode: string
  resolution: string
}

interface ScriptPreferences {
  model: string
}

interface AudioPreferences {
  voice: string
}

interface EditorPreferencesState {
  image: ImagePreferences
  video: VideoPreferences
  script: ScriptPreferences
  audio: AudioPreferences
  updateImagePref: (updates: Partial<ImagePreferences>) => void
  updateVideoPref: (updates: Partial<VideoPreferences>) => void
  updateScriptPref: (updates: Partial<ScriptPreferences>) => void
  updateAudioPref: (updates: Partial<AudioPreferences>) => void
}

export const useEditorPreferencesStore = create<EditorPreferencesState>()(
  persist(
    (set) => ({
      image: { model: '', ratio: '1:1', resolution: '2K', batch: 3 },
      video: { model: '', length: 5, ratio: '16:9', refMode: 'both', resolution: '720P' },
      script: { model: '' },
      audio: { voice: '克隆声音' },

      updateImagePref: (updates) =>
        set((s) => ({ image: { ...s.image, ...updates } })),
      updateVideoPref: (updates) =>
        set((s) => ({ video: { ...s.video, ...updates } })),
      updateScriptPref: (updates) =>
        set((s) => ({ script: { ...s.script, ...updates } })),
      updateAudioPref: (updates) =>
        set((s) => ({ audio: { ...s.audio, ...updates } })),
    }),
    {
      name: 'editor-preferences',
      partialize: (state) => ({
        image: state.image,
        video: state.video,
        script: state.script,
        audio: state.audio,
      }),
    },
  ),
)
