'use client'

import { TranscriptLine } from './TranscriptLine'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SummaryCard } from './SummaryCard'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import type { TranscriptResult, TranscriptVariant, SeoContent } from '@/types'

interface TranscriptViewerProps {
  transcript: TranscriptResult
  variants: Record<string, TranscriptVariant> | null
  seo: SeoContent | null
  activeTab: string
  onTabChange: (tab: 'raw' | 'cleaned' | 'summary' | 'faq') => void
  aiLoading: boolean
  hasAiContent: boolean
  onGenerateAi: () => void
}

export function TranscriptViewer({
  transcript, variants, seo, activeTab, onTabChange,
  aiLoading, hasAiContent, onGenerateAi,
}: TranscriptViewerProps) {
  const hasCleaned = !!variants?.cleaned
  const hasSummary = !!variants?.summary || !!seo?.seoSummary
  const hasFaq = !!variants?.faq || (seo?.seoFaq && seo.seoFaq.length > 0)

  const topicsArray: string[] = seo?.seoTopics
    || (variants?.topics ? (() => { try { return JSON.parse(variants.topics.content) } catch { return [] } })() : [])
  const faqArray: { q: string; a: string }[] = seo?.seoFaq
    || (variants?.faq ? (() => { try { return JSON.parse(variants.faq.content) } catch { return [] } })() : [])

  return (
    <Tabs value={activeTab} onValueChange={(val) => onTabChange(val as 'raw' | 'cleaned' | 'summary' | 'faq')} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="raw">Raw</TabsTrigger>
        {hasCleaned && <TabsTrigger value="cleaned">Cleaned</TabsTrigger>}
        {hasSummary && <TabsTrigger value="summary">Summary</TabsTrigger>}
        {hasFaq && <TabsTrigger value="faq">FAQ</TabsTrigger>}
      </TabsList>

      <TabsContent value="raw" className="border rounded-lg bg-card max-h-[60vh] overflow-y-auto">
        <div className="divide-y divide-border/50">
          {transcript.transcript.map((seg, i) => (
            <TranscriptLine key={i} timestamp={seg.tsDisplay} text={seg.text} />
          ))}
        </div>
      </TabsContent>

      {hasCleaned && (
        <TabsContent value="cleaned" className="border rounded-lg bg-card max-h-[60vh] overflow-y-auto p-4">
          <div className="space-y-3">
            {variants!.cleaned!.content.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm leading-relaxed">{para}</p>
            ))}
          </div>
        </TabsContent>
      )}

      <TabsContent value="summary">
        {aiLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            <span>Generating AI summary...</span>
          </div>
        ) : hasSummary ? (
          <SummaryCard
            summary={variants?.summary?.content || seo?.seoSummary || ''}
            topics={topicsArray}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
            <p>No AI summary yet. Generate one to see key topics and insights.</p>
            <Button variant="secondary" size="sm" onClick={onGenerateAi} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate AI Summary
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="faq">
        {aiLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            <span>Generating FAQ...</span>
          </div>
        ) : hasFaq ? (
          <div className="space-y-4">
            {faqArray.map((faq, i) => (
              <div key={i} className="border rounded-lg p-4 bg-card">
                <h4 className="font-medium mb-2">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p>No FAQ generated yet.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
