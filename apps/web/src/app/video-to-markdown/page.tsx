import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Youtube, FileText, Sparkles, Globe } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Video to Markdown — Convert YouTube Videos to Markdown',
  description:
    'Convert any YouTube video to Markdown format. Export with timestamps to Obsidian, Notion, or any Markdown editor. Free, no account required.',
  alternates: { canonical: `${BASE_URL}/video-to-markdown` },
  openGraph: {
    title: 'Video to Markdown — Convert YouTube Videos to Markdown',
    description: 'Convert YouTube videos to Markdown with timestamps. Perfect for Obsidian, Notion, and knowledge bases.',
    url: `${BASE_URL}/video-to-markdown`,
  },
  keywords: [
    'video to markdown',
    'youtube to markdown',
    'convert video to text',
    'video transcript markdown',
    'youtube to obsidian',
    'video to notion',
  ],
}

const faqItems = [
  {
    q: 'How do I convert a YouTube video to Markdown?',
    a: 'Paste the YouTube URL into our transcript tool, click Get Transcript, then click the "Markdown" export button. The file downloads instantly with timestamps, channel info, and optional AI-generated summary and key topics.',
  },
  {
    q: 'Can I import the Markdown into Obsidian?',
    a: 'Yes. The exported Markdown file is fully compatible with Obsidian. Just drag the .md file into your vault. Timestamps are preserved, and AI summaries are included as headings.',
  },
  {
    q: 'What does the Markdown export include?',
    a: 'The Markdown export includes: video title, channel name, source link, AI-generated summary (if available), key topics list, full transcript with timestamps, FAQ section, and attribution footer.',
  },
]

export default function VideoToMarkdownPage() {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
          Convert YouTube Videos{' '}
          <span className="text-primary">to Markdown</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Extract full transcripts with timestamps and export as clean, well-formatted Markdown.
          Perfect for <strong>Obsidian</strong>, <strong>Notion</strong>, and any Markdown-based workflow.
        </p>
        <Link
          href="/youtube-transcript"
          className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base transition-colors"
        >
          <Youtube className="w-5 h-5 mr-2" aria-hidden="true" />
          Convert a Video Now
          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Link>
      </header>

      <section className="grid sm:grid-cols-3 gap-5 mb-16" aria-label="Benefits">
        {[
          { icon: Globe, title: 'Universal Format', desc: 'Markdown works everywhere — Obsidian, Notion, VS Code, GitHub, and any text editor.' },
          { icon: Sparkles, title: 'AI-Enhanced', desc: 'Optional AI summaries, key topics, and FAQ sections included in the Markdown export.' },
          { icon: FileText, title: 'Timestamped', desc: 'Every transcript line includes the exact timestamp for easy reference and navigation.' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div key={i} className="text-center p-6 rounded-xl border bg-card">
            <Icon className="w-8 h-8 mx-auto mb-3 text-primary" aria-hidden="true" />
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      <section className="mb-16" aria-labelledby="workflows-heading">
        <h2 id="workflows-heading" className="text-2xl font-bold mb-8 text-center">Use Cases</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { title: 'Obsidian Knowledge Base', desc: 'Convert conference talks, lectures, and tutorials to Markdown. Import into your Obsidian vault for full-text search, tagging, and linking.' },
            { title: 'Content Repurposing', desc: 'Turn YouTube interviews into blog posts. The transcript + AI summary gives you a first draft in Markdown, ready to edit and publish.' },
            { title: 'Research & Study Notes', desc: 'Capture academic lectures and panel discussions as timestamped Markdown. Search across transcripts to find specific moments.' },
            { title: 'Notion Databases', desc: 'Import transcripts into Notion databases. Use the Markdown export to populate Notion pages with structured, searchable content.' },
          ].map(({ title, desc }, i) => (
            <div key={i} className="p-5 rounded-xl border bg-card">
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

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

      <section className="text-center py-12 rounded-xl bg-primary/5 border">
        <h2 className="text-xl font-bold mb-3">Ready to convert your first video?</h2>
        <p className="text-muted-foreground mb-6">Free. No account. No limits.</p>
        <Link
          href="/youtube-transcript"
          className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
        >
          <Youtube className="w-5 h-5 mr-2" aria-hidden="true" />
          Start Converting
        </Link>
      </section>
    </div>
  )
}
