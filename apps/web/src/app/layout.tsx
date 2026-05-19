import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageViewTracker } from '@/components/PageViewTracker'
import { NavLinks } from '@/components/NavLinks'

function ensureProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}
const BASE_URL = ensureProtocol(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Transcript Workflow Toolkit — Free YouTube Transcript to Markdown',
    template: '%s — Transcript Workflow Toolkit',
  },
  description:
    'Extract YouTube video transcripts with timestamps. Export to Markdown, TXT, or copy to clipboard. AI-powered summary, key topics, and FAQ. No account required. Free and open source.',

  // Canonical URL for the root
  alternates: { canonical: BASE_URL },

  // Open Graph
  openGraph: {
    type: 'website',
    siteName: 'Transcript Workflow Toolkit',
    title: 'Transcript Workflow Toolkit — Free YouTube Transcript to Markdown',
    description:
      'Extract YouTube video transcripts with timestamps. AI-powered cleaning, summaries, and key topics. Export to Obsidian, Notion, or any Markdown editor.',
    url: BASE_URL,
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Transcript Workflow Toolkit' }],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Transcript Workflow Toolkit',
    description:
      'Extract YouTube video transcripts with timestamps. Export to Markdown, TXT, or copy. Free, no account.',
    images: [`${BASE_URL}/og-image.png`],
  },

  // Search engines
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },

  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },

  // Keywords (still used by Bing and others)
  keywords: [
    'youtube transcript',
    'youtube to markdown',
    'video transcript tool',
    'youtube captions',
    'extract youtube subtitles',
    'transcript generator',
    'video to text',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Transcript Workflow Toolkit',
    url: BASE_URL,
    description:
      'Free tool to extract YouTube video transcripts with timestamps. Export to Markdown, TXT, or clipboard.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  return (
    <html lang="en" translate="no">
      <head>
        {/* Font loading — display=swap prevents FOUT */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        {/* Preconnect to external origins */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://api.deepseek.com" />

        {/* DNS prefetch */}
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />

        {/* Schema.org site-wide */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            async
            defer
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
          />
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="container flex h-14 items-center max-w-4xl mx-auto px-4" aria-label="Main navigation">
              <a href="/" className="flex items-center space-x-2 shrink-0" aria-label="Transcript Workflow Toolkit Home">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span className="font-bold text-lg hidden sm:inline">Transcript Toolkit</span>
              </a>
              <NavLinks />
            </nav>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>

          {/* Footer — SEO-rich, internal links */}
          <footer className="border-t bg-muted/30">
            <div className="container max-w-4xl mx-auto px-4 py-8">
              <nav className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm" aria-label="Footer navigation">
                <div>
                  <h3 className="font-semibold mb-3">Tools</h3>
                  <ul className="space-y-2">
                    <li><a href="/youtube-transcript" className="text-muted-foreground hover:text-foreground transition-colors">YouTube Transcript</a></li>
                    <li><a href="/video-to-markdown" className="text-muted-foreground hover:text-foreground transition-colors">Video to Markdown</a></li>
                    <li><span className="text-muted-foreground/50">TikTok Transcript (Soon)</span></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Resources</h3>
                  <ul className="space-y-2">
                    <li><a href="/youtube-transcript" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
                    <li><a href="/video-to-markdown" className="text-muted-foreground hover:text-foreground transition-colors">Export Guide</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">About</h3>
                  <ul className="space-y-2">
                    <li><a href="https://github.com/YOUR_USERNAME/transcript-workflow-toolkit" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a></li>
                    <li><span className="text-muted-foreground">Open Source (MIT)</span></li>
                  </ul>
                </div>
              </nav>
              <p className="text-xs text-muted-foreground mt-8 pt-4 border-t">
                Transcript Workflow Toolkit — Free, open-source YouTube transcript extraction. No accounts, no tracking, your data stays local.
              </p>
            </div>
          </footer>
        </div>
        <PageViewTracker />
      </body>
    </html>
  )
}
