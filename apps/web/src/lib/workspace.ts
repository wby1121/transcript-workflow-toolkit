// Client-side only — uses IndexedDB via idb-keyval
// This file is safe to import on server (guarded by typeof window checks)

export interface RecentTranscript {
  videoId: string
  title: string
  channelName?: string
  thumbnailUrl?: string
  accessedAt: number
}

export interface RecentExport {
  videoId: string
  title: string
  format: 'md' | 'txt' | 'copy'
  exportedAt: number
}

export interface LastSession {
  videoId: string
  title: string
  tabState: string
  savedAt: number
}

const MAX_ITEMS = 20

async function getStore() {
  if (typeof window === 'undefined') return null
  const { get, set, del } = await import('idb-keyval')
  return { get, set, del }
}

export async function getRecentTranscripts(): Promise<RecentTranscript[]> {
  const store = await getStore()
  if (!store) return []
  try {
    const data = await store.get('recent-transcripts')
    return data || []
  } catch {
    return []
  }
}

export async function addRecentTranscript(item: Omit<RecentTranscript, 'accessedAt'>): Promise<void> {
  const store = await getStore()
  if (!store) return
  try {
    const items = await getRecentTranscripts()
    const filtered = items.filter(i => i.videoId !== item.videoId)
    filtered.unshift({ ...item, accessedAt: Date.now() })
    if (filtered.length > MAX_ITEMS) filtered.pop()
    await store.set('recent-transcripts', filtered)
  } catch {
    // Fail silently — workspace is a nice-to-have
  }
}

export async function getRecentExports(): Promise<RecentExport[]> {
  const store = await getStore()
  if (!store) return []
  try {
    const data = await store.get('recent-exports')
    return data || []
  } catch {
    return []
  }
}

export async function addRecentExport(item: Omit<RecentExport, 'exportedAt'>): Promise<void> {
  const store = await getStore()
  if (!store) return
  try {
    const items = await getRecentExports()
    items.unshift({ ...item, exportedAt: Date.now() })
    if (items.length > MAX_ITEMS) items.pop()
    await store.set('recent-exports', items)
  } catch {
    // Fail silently
  }
}

export async function saveLastSession(session: Omit<LastSession, 'savedAt'>): Promise<void> {
  const store = await getStore()
  if (!store) return
  try {
    await store.set('last-session', { ...session, savedAt: Date.now() })
  } catch {
    // Fail silently
  }
}

export async function getLastSession(): Promise<LastSession | null> {
  const store = await getStore()
  if (!store) return null
  try {
    return await store.get('last-session') || null
  } catch {
    return null
  }
}
