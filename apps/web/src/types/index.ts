// ---- Transcript ----

export interface TranscriptSegment {
  tsSeconds: number
  tsDisplay: string        // "00:24"
  text: string
}

export interface TranscriptResult {
  videoId: string
  url: string
  title: string
  channelName?: string
  thumbnailUrl?: string
  durationSeconds?: number
  transcript: TranscriptSegment[]
  language: string
  provider: string           // 'youtube_api' | 'yt_dlp'
}

// ---- Variants ----

export type VariantType =
  | 'raw'
  | 'cleaned'
  | 'summary'
  | 'topics'
  | 'headings'
  | 'faq'
  | 'blog'
  | 'study_notes'
  | 'markdown'

export interface TranscriptVariant {
  id: number
  videoId: string
  variantType: VariantType
  content: string
  method: 'rule' | 'ai' | 'raw'
  tokensUsed?: number
  createdAt: string
}

// ---- SEO ----

export interface SeoContent {
  videoId: string
  seoSummary?: string
  seoTopics?: string[]
  seoFaq?: FaqEntry[]
  slug: string
  metaTitle?: string
  metaDescription?: string
}

export interface FaqEntry {
  q: string
  a: string
}

// ---- Job Queue ----

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface Job {
  id: string
  videoId: string
  status: JobStatus
  progress?: string
  errorType?: string
  errorMessage?: string
  provider?: string
  resultJson?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  durationMs?: number
}

// ---- API ----

export interface TranscriptRequest {
  url: string
}

export interface TranscriptResponse {
  cached: boolean
  jobId: string | null
  status: JobStatus
  transcript?: TranscriptResult
  variants?: Record<string, TranscriptVariant>
  seo?: SeoContent
}

export interface JobPollResponse {
  jobId: string
  status: JobStatus
  progress?: string
  provider?: string
  videoId?: string
  transcript?: TranscriptResult
  variants?: Record<string, TranscriptVariant>
  error?: string
  code?: string
  retryable?: boolean
}

export interface CleanRequest {
  videoId: string
  options: {
    variants: VariantType[]
  }
}

export interface CleanResponse {
  variants: Record<string, TranscriptVariant>
}

export interface ExportRequest {
  videoId: string
  format: 'md' | 'txt'
}

// ---- Analytics ----

export type AnalyticsEventType =
  | 'transcript_request'
  | 'transcript_completed'
  | 'transcript_failed'
  | 'export_md'
  | 'export_txt'
  | 'export_copy'
  | 'ai_clean'
  | 'ai_summary'
  | 'ai_topics'
  | 'ai_faq'
  | 'page_view'
  | 'seo_landing'
  | 'retry'

// ---- Provider ----

export interface TranscriptProvider {
  name: string
  priority: number
  fetch(videoId: string): Promise<{
    transcript: TranscriptSegment[]
    title: string
    channelName?: string
    thumbnailUrl?: string
    durationSeconds?: number
    language: string
  }>
  isAvailable(): Promise<boolean>
}

// ---- Component State ----

export type ViewState = 'idle' | 'submitting' | 'polling' | 'success' | 'error'

export interface AppState {
  viewState: ViewState
  jobId: string | null
  transcript: TranscriptResult | null
  variants: Record<string, TranscriptVariant> | null
  seo: SeoContent | null
  error: string | null
  errorCode: string | null
  activeTab: 'raw' | 'cleaned' | 'summary' | 'faq'
}
