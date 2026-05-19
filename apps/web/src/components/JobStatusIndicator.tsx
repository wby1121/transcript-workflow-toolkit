'use client'

import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { JobStatus } from '@/types'

interface JobStatusIndicatorProps {
  status: JobStatus
  progress?: string
  error?: string
}

export function JobStatusIndicator({ status, progress, error }: JobStatusIndicatorProps) {
  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-5 h-5" />
        <span>Transcript ready</span>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="w-5 h-5" />
        <span>{error || 'Failed to fetch transcript'}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>{progress || 'Processing...'}</span>
    </div>
  )
}
