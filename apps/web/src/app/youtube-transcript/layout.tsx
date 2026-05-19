import type { Metadata } from 'next'

function ensureProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}
const BASE_URL = ensureProtocol(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

export const metadata: Metadata = {
  title: 'YouTube Transcript Tool — Extract Timestamped Transcripts',
  description:
    'Free YouTube transcript extractor. Paste any URL, get full transcript with timestamps. Export to Markdown, TXT, or clipboard. AI summaries and key topics. No account required.',
  alternates: { canonical: `${BASE_URL}/youtube-transcript` },
  openGraph: {
    title: 'YouTube Transcript Tool — Extract Timestamped Transcripts',
    description:
      'Free tool to extract YouTube video transcripts with timestamps. Export to Markdown, TXT, or copy to clipboard.',
    url: `${BASE_URL}/youtube-transcript`,
  },
  robots: { index: true, follow: true },
}

export default function YouTubeTranscriptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
