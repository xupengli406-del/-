import { Bookmark } from 'lucide-react'

export default function BookmarksPanel() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-apple-text-tertiary">
      <Bookmark size={24} strokeWidth={1} className="mb-2 opacity-40" />
      <span className="text-[11px]">暂无书签</span>
    </div>
  )
}
