import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse YouTube URL to extract video ID
export function parseYouTubeUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Generate URL-safe slug from title
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

// Format seconds to display timestamp
export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Hash IP for privacy
export function hashIp(ip: string): string {
  // Simple hash for analytics — not cryptographic
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

// Extract search query from referrer URL
export function parseReferrerKeyword(referrer: string): { query: string; source: string } | null {
  try {
    const url = new URL(referrer)
    let source = 'other'

    if (url.hostname.includes('google.')) {
      source = 'google'
      const q = url.searchParams.get('q')
      if (q) return { query: q, source }
    } else if (url.hostname.includes('bing.')) {
      source = 'bing'
      const q = url.searchParams.get('q')
      if (q) return { query: q, source }
    } else if (url.hostname.includes('duckduckgo.')) {
      source = 'duckduckgo'
      const q = url.searchParams.get('q')
      if (q) return { query: q, source }
    }

    return null
  } catch {
    return null
  }
}
