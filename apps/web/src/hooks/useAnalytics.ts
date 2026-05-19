'use client'

import { useCallback } from 'react'
import type { AnalyticsEventType } from '@/types'

export function useAnalytics() {
  const track = useCallback(async (
    eventType: AnalyticsEventType,
    videoId?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, videoId, metadata }),
      })
    } catch {
      // Analytics failures are silent
    }
  }, [])

  return { track }
}
