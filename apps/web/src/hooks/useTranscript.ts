'use client'

import { useState, useCallback } from 'react'
import type { AppState, TranscriptVariant } from '@/types'

export function useTranscript() {
  const [state, setState] = useState<AppState>({
    viewState: 'idle',
    jobId: null,
    transcript: null,
    variants: null,
    seo: null,
    error: null,
    errorCode: null,
    activeTab: 'raw',
  })

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const submitUrl = useCallback(async (url: string) => {
    setState(s => ({
      ...s,
      viewState: 'submitting',
      error: null, errorCode: null,
      transcript: null, variants: null, seo: null,
    }))
    setAiError(null)

    try {
      const res = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      if (!res.ok) {
        setState(s => ({
          ...s, viewState: 'error',
          error: data.error || `Server error (${res.status})`,
          errorCode: data.code || 'UNKNOWN',
        }))
        return
      }

      setState(s => ({
        ...s, viewState: 'success', jobId: null,
        transcript: data.transcript,
        variants: data.variants || null,
        seo: data.seo || null,
        activeTab: data.variants?.summary ? 'summary' : data.variants?.cleaned ? 'cleaned' : 'raw',
      }))
    } catch (err) {
      setState(s => ({
        ...s, viewState: 'error',
        error: err instanceof Error ? err.message : 'Network error',
        errorCode: 'NETWORK_ERROR',
      }))
    }
  }, [])

  const generateAi = useCallback(async () => {
    if (!state.transcript) return

    setAiLoading(true)
    setAiError(null)

    try {
      const res = await fetch('/api/transcript/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: state.transcript.videoId,
          options: { variants: ['cleaned', 'summary', 'topics', 'headings', 'faq'] },
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAiError(data.error || 'AI generation failed')
        setAiLoading(false)
        return
      }

      // Merge new variants with existing
      const merged: Record<string, TranscriptVariant> = {
        ...(state.variants || {}),
        ...data.variants,
      }

      setState(s => ({
        ...s,
        variants: merged,
        // Switch to summary tab if available
        activeTab: merged.summary ? 'summary' : s.activeTab,
      }))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed')
    } finally {
      setAiLoading(false)
    }
  }, [state.transcript, state.variants])

  const retry = useCallback(() => {
    setState(s => ({ ...s, viewState: 'idle', error: null, errorCode: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      viewState: 'idle', jobId: null,
      transcript: null, variants: null, seo: null,
      error: null, errorCode: null, activeTab: 'raw',
    })
    setAiError(null)
    setAiLoading(false)
  }, [])

  const setActiveTab = useCallback((tab: AppState['activeTab']) => {
    setState(s => ({ ...s, activeTab: tab }))
  }, [])

  return { state, aiLoading, aiError, submitUrl, generateAi, retry, reset, setActiveTab }
}
