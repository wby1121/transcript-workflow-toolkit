import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TikTok Transcript Tool — Coming Soon',
  description: 'TikTok transcript extraction is coming soon. Currently supporting YouTube transcripts.',
}

export default function TikTokTranscriptPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">TikTok Transcript Tool</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
        TikTok transcript extraction is coming soon. We are working on reliable TikTok subtitle extraction.
      </p>
      <div className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-muted text-muted-foreground font-medium">
        Coming Soon
      </div>
      <p className="text-sm text-muted-foreground mt-8">
        In the meantime, try our{' '}
        <a href="/youtube-transcript" className="text-primary hover:underline">
          YouTube Transcript Tool
        </a>
      </p>
    </div>
  )
}
