'use client'

import { useLocalWorkspace } from '@/hooks/useLocalWorkspace'
import { Clock } from 'lucide-react'
import Image from 'next/image'

interface RecentHistoryProps {
  onSelect: (videoId: string) => void
}

export function RecentHistory({ onSelect }: RecentHistoryProps) {
  const { recentTranscripts, loaded } = useLocalWorkspace()

  if (!loaded || recentTranscripts.length === 0) return null

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Recent</span>
      </div>
      <div className="space-y-1">
        {recentTranscripts.slice(0, 5).map((item) => (
          <button
            key={item.videoId}
            onClick={() => onSelect(item.videoId)}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center gap-3 group"
          >
            <div className="relative w-20 h-[45px] shrink-0 rounded overflow-hidden bg-muted">
              <Image
                src={item.thumbnailUrl?.replace('/maxresdefault.jpg', '/mqdefault.jpg')
                  || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                alt=""
                width={160}
                height={90}
                className="object-cover"
                sizes="80px"
                loading="lazy"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate group-hover:text-primary transition-colors">{item.title}</p>
              {item.channelName && (
                <p className="text-xs text-muted-foreground">{item.channelName}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
