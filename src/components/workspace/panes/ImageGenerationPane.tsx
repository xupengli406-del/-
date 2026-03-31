import GenerationPane from './GenerationPane'

interface ImageGenerationPaneProps {
  fileId: string
}

export default function ImageGenerationPane({ fileId }: ImageGenerationPaneProps) {
  return <GenerationPane fileId={fileId} mode="image" />
}
