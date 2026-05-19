import { NextRequest, NextResponse } from 'next/server'
import { getCachedTranscript } from '@/lib/cache'
import { saveVariant } from '@/lib/variants'
import { cleanTranscriptToText } from '@/lib/transcript/cleaner'
import { generateSummary } from '@/lib/ai/summary'
import { extractTopics } from '@/lib/ai/topics'
import { generateHeadings } from '@/lib/ai/headings'
import { generateFaq } from '@/lib/ai/faq'
import { saveSeoContent } from '@/lib/seo'
import { logEvent } from '@/lib/analytics'
import type { VariantType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, options } = body as {
      videoId: string
      options: { variants: VariantType[] }
    }

    const transcript = getCachedTranscript(videoId)
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found. Fetch it first.' }, { status: 404 })
    }

    const variants: Record<string, unknown> = {}
    const rawText = transcript.transcript.map((s) => `[${s.tsDisplay}] ${s.text}`).join('\n')

    for (const variantType of options.variants) {
      try {
        if (variantType === 'cleaned') {
          const cleanedText = cleanTranscriptToText(transcript.transcript)
          saveVariant(videoId, 'cleaned', cleanedText, 'rule')
          variants.cleaned = { content: cleanedText, method: 'rule' }

        } else if (variantType === 'summary') {
          logEvent('ai_summary', { videoId })
          const result = await generateSummary(rawText)
          if (result.summary) {
            saveVariant(videoId, 'summary', result.summary, 'ai', result.tokensUsed)
            variants.summary = { content: result.summary, method: 'ai', tokensUsed: result.tokensUsed }
          }

        } else if (variantType === 'topics') {
          logEvent('ai_topics', { videoId })
          const result = await extractTopics(rawText)
          if (result.topics.length > 0) {
            const json = JSON.stringify(result.topics)
            saveVariant(videoId, 'topics', json, 'ai', result.tokensUsed)
            variants.topics = { content: json, method: 'ai', tokensUsed: result.tokensUsed }
          }

        } else if (variantType === 'headings') {
          const words = rawText.split(/\s+/)
          const chunks: string[] = []
          for (let i = 0; i < words.length; i += 500) {
            chunks.push(words.slice(i, i + 500).join(' '))
          }
          const result = await generateHeadings(chunks.slice(0, 8))
          if (result.headings.length > 0) {
            const json = JSON.stringify(result.headings)
            saveVariant(videoId, 'headings', json, 'ai', result.tokensUsed)
            variants.headings = { content: json, method: 'ai', tokensUsed: result.tokensUsed }
          }

        } else if (variantType === 'faq') {
          logEvent('ai_faq', { videoId })
          // First try to get summary and topics for FAQ context
          const summaryText = (variants.summary as { content?: string })?.content || rawText.substring(0, 2000)
          const topicsList: string[] = (() => {
            try {
              const t = (variants.topics as { content?: string })?.content
              return t ? JSON.parse(t) : []
            } catch { return [] }
          })()
          const result = await generateFaq(summaryText, topicsList)
          if (result.faq.length > 0) {
            const json = JSON.stringify(result.faq)
            saveVariant(videoId, 'faq', json, 'ai', result.tokensUsed)
            variants.faq = { content: json, method: 'ai', tokensUsed: result.tokensUsed }
          }
        }
      } catch (err) {
        console.error(`[Clean API] Variant '${variantType}' generation failed:`, err)
        // Continue with other variants — best effort
      }
    }

    // Generate SEO content if we have summary or topics
    const summaryV = variants.summary as { content?: string } | undefined
    const topicsV = variants.topics as { content?: string } | undefined
    const faqV = variants.faq as { content?: string } | undefined

    if (summaryV?.content || topicsV?.content) {
      try {
        saveSeoContent({
          videoId,
          summary: summaryV?.content,
          topics: topicsV?.content ? JSON.parse(topicsV.content) : undefined,
          faq: faqV?.content ? JSON.parse(faqV.content) : undefined,
          title: transcript.title,
        })
        logEvent('ai_summary', { videoId, metadata: { seoGenerated: true } })
      } catch (err) {
        console.error('[Clean API] SEO content generation failed:', err)
      }
    }

    return NextResponse.json({ variants })

  } catch (err) {
    console.error('[Clean API] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
