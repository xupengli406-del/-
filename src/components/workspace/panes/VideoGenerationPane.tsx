import GenerationPane from './GenerationPane'

interface VideoGenerationPaneProps {
  fileId: string
}

export default function VideoGenerationPane({ fileId }: VideoGenerationPaneProps) {
  return <GenerationPane fileId={fileId} mode="video" />
}
