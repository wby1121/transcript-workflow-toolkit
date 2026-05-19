'use client'

import { useEffect } from 'react'
import { useTranscript } from '@/hooks/useTranscript'
import { useLocalWorkspace } from '@/hooks/useLocalWorkspace'
import { useAnalytics } from '@/hooks/useAnalytics'
import { UrlInput } from '@/components/UrlInput'
import { VideoInfo } from '@/components/VideoInfo'


import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorDisplay } from '@/components/ErrorDisplay'

import { SEOContent } from '@/components/SEOContent'
import dynamic from 'next/dynamic'

const TranscriptViewer = dynamic(() => import('@/components/TranscriptViewer').then(m => ({ default: m.TranscriptViewer })), {
  loading: () => <div className="flex justify-center py-16"><div className="animate-pulse h-64 w-full max-w-2xl rounded-lg bg-muted" /></div>,
})

const ExportBar = dynamic(() => import('@/components/ExportBar').then(m => ({ default: m.ExportBar })), {
  ssr: false,
})

const RecentHistory = dynamic(() => import('@/components/RecentHistory').then(m => ({ default: m.RecentHistory })), {
  ssr: false,
})
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function YouTubeTranscriptPage() {
  const { state, aiLoading, aiError, submitUrl, generateAi, retry, reset, setActiveTab } = useTranscript()
  const { addTranscript, saveSession } = useLocalWorkspace()
  const { track } = useAnalytics()

  useEffect(() => {
    if (state.viewState === 'success' && state.transcript) {
      addTranscript({
        videoId: state.transcript.videoId,
        title: state.transcript.title,
        channelName: state.transcript.channelName,
        thumbnailUrl: state.transcript.thumbnailUrl,
      })
      saveSession({
        videoId: state.transcript.videoId,
        title: state.transcript.title,
        tabState: state.activeTab,
      })
    }
  }, [state.viewState, state.transcript, state.activeTab, addTranscript, saveSession])

  useEffect(() => { track('page_view') }, [track])

  const isLoading = state.viewState === 'submitting'
  const hasAiContent = !!state.variants?.summary || !!state.variants?.faq

  const handleHistorySelect = (videoId: string) => {
    submitUrl(`https://www.youtube.com/watch?v=${videoId}`)
  }

  return (
    <ErrorBoundary>
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-center mb-8">
        <UrlInput onSubmit={submitUrl} isLoading={isLoading} />
      </div>

      {state.viewState === 'idle' && (
        <div className="flex justify-center mb-8">
          <RecentHistory onSelect={handleHistorySelect} />
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center">
          <LoadingSkeleton />
        </div>
      )}

      {state.viewState === 'error' && (
        <ErrorDisplay
          message={state.error || 'An unexpected error occurred'}
          onRetry={retry}
          onReset={reset}
        />
      )}

      {state.viewState === 'success' && state.transcript && (
        <div className="space-y-6">
          <VideoInfo
            title={state.transcript.title}
            channelName={state.transcript.channelName}
            thumbnailUrl={state.transcript.thumbnailUrl}
            videoId={state.transcript.videoId}
          />

          <div className="flex flex-wrap items-center gap-3">
            <ExportBar
              transcript={state.transcript}
              variants={state.variants}
              seo={state.seo}
            />

            {!hasAiContent && (
              <Button
                variant="secondary"
                size="sm"
                onClick={generateAi}
                disabled={aiLoading}
                className="gap-2"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {aiLoading ? 'Generating...' : 'Generate AI Summary'}
              </Button>
            )}
          </div>

          {aiError && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>AI generation failed: {aiError}. Using rule-based cleaning instead.</span>
            </div>
          )}

          <TranscriptViewer
            transcript={state.transcript}
            variants={state.variants}
            seo={state.seo}
            activeTab={state.activeTab}
            onTabChange={setActiveTab}
            aiLoading={aiLoading}
            hasAiContent={hasAiContent}
            onGenerateAi={generateAi}
          />
        </div>
      )}

      {state.viewState === 'idle' && (
        <div className="flex justify-center">
          <EmptyState />
        </div>
      )}

      <SEOContent />
    </div>
    </ErrorBoundary>
  )
}
