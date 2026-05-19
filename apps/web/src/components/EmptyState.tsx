import { Youtube } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Youtube className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">Paste a YouTube URL above to get started</p>
      <p className="text-sm mt-2">
        Supports: youtube.com/watch, youtu.be, youtube.com/shorts
      </p>
    </div>
  )
}
