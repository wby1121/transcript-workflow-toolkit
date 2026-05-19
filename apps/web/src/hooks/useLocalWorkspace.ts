'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RecentTranscript, RecentExport, LastSession } from '@/lib/workspace'
import {
  getRecentTranscripts,
  addRecentTranscript,
  getRecentExports,
  addRecentExport,
  saveLastSession,
  getLastSession,
} from '@/lib/workspace'

export function useLocalWorkspace() {
  const [recentTranscripts, setRecentTranscripts] = useState<RecentTranscript[]>([])
  const [recentExports, setRecentExports] = useState<RecentExport[]>([])
  const [lastSession, setLastSession] = useState<LastSession | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const [transcripts, exports, session] = await Promise.all([
        getRecentTranscripts(),
        getRecentExports(),
        getLastSession(),
      ])
      setRecentTranscripts(transcripts)
      setRecentExports(exports)
      setLastSession(session)
      setLoaded(true)
    }
    load()
  }, [])

  const addTranscript = useCallback(async (item: Omit<RecentTranscript, 'accessedAt'>) => {
    await addRecentTranscript(item)
    const updated = await getRecentTranscripts()
    setRecentTranscripts(updated)
  }, [])

  const addExport = useCallback(async (item: Omit<RecentExport, 'exportedAt'>) => {
    await addRecentExport(item)
    const updated = await getRecentExports()
    setRecentExports(updated)
  }, [])

  const saveSession = useCallback(async (session: Omit<LastSession, 'savedAt'>) => {
    await saveLastSession(session)
  }, [])

  return {
    recentTranscripts,
    recentExports,
    lastSession,
    loaded,
    addTranscript,
    addExport,
    saveSession,
  }
}
