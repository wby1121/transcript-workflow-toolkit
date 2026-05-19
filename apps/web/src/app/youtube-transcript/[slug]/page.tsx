import { getSeoBySlug } from '@/lib/seo'
import { getCachedTranscript, getCachedVariants } from '@/lib/cache'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const seo = getSeoBySlug(params.slug)
    if (!seo) return { title: 'Transcript Not Found' }

    const transcript = getCachedTranscript(seo.videoId)
    const title = transcript?.title || params.slug.replace(/-/g, ' ')

    return {
      title: `${title} — Transcript`,
      description:
        seo.metaDescription ||
        seo.seoSummary?.substring(0, 160) ||
        `Full transcript of "${title}" with timestamps. Export to Markdown, TXT, or copy to clipboard.`,
      alternates: { canonical: `${BASE_URL}/youtube-transcript/${params.slug}` },
      openGraph: {
        title: `${title} — Transcript`,
        description: seo.metaDescription || seo.seoSummary?.substring(0, 160) || '',
        url: `${BASE_URL}/youtube-transcript/${params.slug}`,
        type: 'article',
      },
    }
  } catch {
    return { title: 'Transcript | Transcript Workflow Toolkit' }
  }
}

export default function TranscriptSeoPage({ params }: Props) {
  let seo, transcript, variants

  try {
    seo = getSeoBySlug(params.slug)
    if (!seo) notFound()
    transcript = getCachedTranscript(seo.videoId)
    if (!transcript) notFound()
    variants = getCachedVariants(seo.videoId)
  } catch {
    notFound()
  }

  const topics: string[] = seo.seoTopics || []
  const faq: { q: string; a: string }[] = seo.seoFaq || []
  const summary = seo.seoSummary || (variants?.summary?.content)
  const metaDescriptions = seo.metaDescription || seo.seoSummary?.substring(0, 160) || ''

  // Article Schema.org
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${transcript.title} — Full Transcript with Timestamps`,
    description: metaDescriptions,
    about: topics.map((t: string) => ({ '@type': 'Thing', name: t })),
    datePublished: transcript.fetchedAt || new Date().toISOString(),
    author: transcript.channelName ? { '@type': 'Person', name: transcript.channelName } : undefined,
  }

  // FAQ Schema
  const faqSchema = faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  } : null

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'YouTube Transcript Tool', item: `${BASE_URL}/youtube-transcript` },
      { '@type': 'ListItem', position: 3, name: `${transcript.title} — Transcript` },
    ],
  }

  // Related transcript links (from same channel or just recommended)
  const relatedLinks = [
    { label: 'Try another video', href: '/youtube-transcript' },
    { label: 'Video to Markdown guide', href: '/video-to-markdown' },
  ]

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li><a href="/" className="hover:text-foreground transition-colors">Home</a></li>
          <li aria-hidden="true" className="mx-1">/</li>
          <li><a href="/youtube-transcript" className="hover:text-foreground transition-colors">YouTube Transcript Tool</a></li>
          <li aria-hidden="true" className="mx-1">/</li>
          <li className="text-foreground/70 truncate max-w-[200px]" aria-current="page">{transcript.title}</li>
        </ol>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-3">{transcript.title} — Transcript</h1>
          <p className="text-muted-foreground">
            Full transcript with timestamps{transcript.channelName && (
              <span> · Channel: <strong>{transcript.channelName}</strong></span>
            )}
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="/youtube-transcript"
              className="inline-flex items-center text-sm text-primary hover:underline font-medium"
            >
              ← Extract your own transcript
            </a>
            {transcript.videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${transcript.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Watch on YouTube ↗
              </a>
            )}
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className="mb-8 p-5 bg-muted/30 rounded-xl border" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="text-lg font-semibold mb-3">Summary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Key Topics */}
        {topics.length > 0 && (
          <section className="mb-8" aria-labelledby="topics-heading">
            <h2 id="topics-heading" className="text-lg font-semibold mb-3">Key Topics Covered</h2>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Full Transcript */}
        <section className="mb-8" aria-labelledby="transcript-heading">
          <h2 id="transcript-heading" className="text-lg font-semibold mb-3">Full Transcript (with Timestamps)</h2>
          <div className="border rounded-xl bg-card divide-y divide-border/50 overflow-hidden">
            {transcript.transcript.map((seg, i) => (
              <div key={i} className="flex gap-3 py-2.5 px-4 hover:bg-muted/40 transition-colors">
                <span className="text-xs font-mono text-primary shrink-0 w-12 text-right select-none pt-0.5">
                  {seg.tsDisplay}
                </span>
                <p className="text-sm leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mb-8" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details key={i} className="group border rounded-lg bg-card">
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-sm hover:bg-muted/50 rounded-lg transition-colors">
                    {item.q}
                    <svg className="w-4 h-4 shrink-0 ml-2 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related links */}
        <aside className="mt-8 p-5 rounded-xl border bg-muted/30" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-sm font-semibold mb-3">You might also like</h2>
          <ul className="space-y-2">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm text-primary hover:underline">
                  {link.label} →
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </article>
    </div>
  )
}
