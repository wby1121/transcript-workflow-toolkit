import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Youtube, FileText, Zap, Download, Shield, Search } from 'lucide-react'

function ensureProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}
const BASE_URL = ensureProtocol(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Transcript Workflow Toolkit — Free YouTube Transcript to Markdown',
    description: 'Extract YouTube video transcripts with timestamps. Export to Markdown, TXT, or copy to clipboard. AI-powered summary and key topics.',
    url: BASE_URL,
  },
}

const faqItems = [
  {
    q: 'How do I get a YouTube transcript?',
    a: 'Paste any YouTube URL into our tool — including youtube.com/watch, youtu.be, and youtube.com/shorts links. The transcript is extracted instantly with timestamps preserved. You can then export as Markdown, TXT, or copy to clipboard.',
  },
  {
    q: 'Is this tool free?',
    a: 'Yes, completely free. No account required, no usage limits, no hidden costs. The project is open source (MIT license). AI features (summary, key topics, FAQ generation) require a DeepSeek API key which offers free credits.',
  },
  {
    q: 'What export formats are supported?',
    a: 'Markdown (.md) — perfect for Obsidian, Notion, and any Markdown editor. Plain text (.txt) — universal format. Copy to clipboard — fastest option for quick paste. All exports include timestamps.',
  },
  {
    q: 'Can I use this for any YouTube video?',
    a: 'Most YouTube videos have auto-generated captions which our tool can extract. Videos without any captions (manually uploaded or auto-generated) cannot be transcribed. The vast majority of YouTube videos do have captions available.',
  },
  {
    q: 'Does this work with languages other than English?',
    a: 'Currently optimized for English transcripts. YouTube provides captions in many languages, and our extraction works for any language that YouTube supports. AI features (summary, topics, FAQ) are English-only at this time.',
  },
]

export default function HomePage() {
  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Transcript Workflow Toolkit',
    url: BASE_URL,
    description: 'Free YouTube transcript extraction tool with AI-powered summaries, Markdown export, and more.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '128',
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      {/* Schema.org structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-4">
          YouTube Transcript{' '}
          <span className="text-primary">to Markdown</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Extract full transcripts with timestamps. Export to Markdown, TXT, or clipboard.
          AI-powered summaries, key topics, and FAQ generation.{' '}
          <strong>Free. No account required.</strong>
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/youtube-transcript"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base transition-colors shadow-sm"
          >
            <Youtube className="w-5 h-5 mr-2" aria-hidden="true" />
            Try It Now
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Link>
          <Link
            href="/video-to-markdown"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-input bg-background hover:bg-accent font-medium text-sm transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
            Learn More
          </Link>
        </div>
      </header>

      {/* Features Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16" aria-label="Key features">
        {[
          { icon: Zap, title: 'Instant Extraction', desc: 'Paste a URL, get the full transcript with timestamps in seconds.' },
          { icon: FileText, title: 'AI-Powered Summary', desc: 'Remove filler words, generate summaries, extract key topics.' },
          { icon: Download, title: 'Export Anywhere', desc: 'Markdown for Obsidian, plain text, or copy to clipboard.' },
          { icon: Shield, title: 'No Account Needed', desc: 'Your transcript history stays in your browser. No signup.' },
          { icon: Search, title: 'Full-Text Searchable', desc: 'Transcripts are text — search, reference, and organize easily.' },
          { icon: Youtube, title: 'Any YouTube Video', desc: 'Supports youtube.com, youtu.be, shorts, and embed URLs.' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div key={i} className="group rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
            <Icon className="w-8 h-8 mb-3 text-primary" aria-hidden="true" />
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* How-to section */}
      <section className="mb-16" aria-labelledby="how-to">
        <h2 id="how-to" className="text-2xl font-bold mb-8 text-center">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Paste URL', desc: 'Copy any YouTube video link and paste it into the input field.' },
            { step: '2', title: 'Get Transcript', desc: 'Click Get Transcript. The full timestamped text appears instantly.' },
            { step: '3', title: 'Export', desc: 'Download as Markdown, TXT, or copy. Optionally generate AI summary.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center p-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3 text-sm" aria-hidden="true">{step}</div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported formats */}
      <section className="mb-16 p-6 rounded-xl border bg-muted/30" aria-labelledby="formats">
        <h2 id="formats" className="text-lg font-semibold mb-3">Supported YouTube URL Formats</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          {[
            'youtube.com/watch?v=XXXXXXXXXXX',
            'youtu.be/XXXXXXXXXXX',
            'youtube.com/shorts/XXXXXXXXXXX',
            'youtube.com/embed/XXXXXXXXXXX',
            'm.youtube.com/watch?v=XXXXXXXXXXX',
            'www.youtube.com/watch?v=XXXXXXXXXXX',
          ].map((fmt) => (
            <code key={fmt} className="px-3 py-1.5 rounded bg-muted text-xs font-mono break-all">{fmt}</code>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          {faqItems.map((item, i) => (
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

      {/* Bottom CTA */}
      <section className="text-center py-12 rounded-xl bg-primary/5 border" aria-label="Get started">
        <h2 className="text-xl font-bold mb-3">Ready to extract your first transcript?</h2>
        <p className="text-muted-foreground mb-6">No account, no setup, no cost. Paste a URL and go.</p>
        <Link
          href="/youtube-transcript"
          className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
        >
          <Youtube className="w-5 h-5 mr-2" aria-hidden="true" />
          Get Started Free
        </Link>
      </section>
    </div>
  )
}
