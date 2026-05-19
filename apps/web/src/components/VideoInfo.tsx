import Image from 'next/image'

interface VideoInfoProps {
  title: string
  channelName?: string
  thumbnailUrl?: string
  videoId: string
}

export function VideoInfo({ title, channelName, thumbnailUrl, videoId }: VideoInfoProps) {
  // Use smaller YouTube thumbnail for faster load
  const optimizedThumb = thumbnailUrl?.replace('/maxresdefault.jpg', '/mqdefault.jpg')
    || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

  return (
    <div className="flex gap-4 items-start">
      {optimizedThumb && (
        <div className="relative w-40 h-[90px] shrink-0 rounded-md overflow-hidden bg-muted">
          <Image
            src={optimizedThumb}
            alt={`Thumbnail for ${title}`}
            width={320}
            height={180}
            className="object-cover"
            sizes="160px"
            priority
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-tight truncate">{title}</h2>
        {channelName && (
          <p className="text-sm text-muted-foreground mt-1">{channelName}</p>
        )}
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-1 inline-block"
        >
          Watch on YouTube &rarr;
        </a>
      </div>
    </div>
  )
}
