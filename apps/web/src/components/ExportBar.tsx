'use client'

import { Button } from '@/components/ui/button'
import { Download, Copy, FileText, Check } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { generateMarkdown, generatePlainText, generateClipboardText } from '@/lib/export'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLocalWorkspace } from '@/hooks/useLocalWorkspace'
import type { TranscriptResult, TranscriptVariant, SeoContent } from '@/types'

interface ExportBarProps {
  transcript: TranscriptResult
  variants: Record<string, TranscriptVariant> | null
  seo: SeoContent | null
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ExportBar({ transcript, variants, seo }: ExportBarProps) {
  const { copied, copy } = useCopyToClipboard()
  const { track } = useAnalytics()
  const { addExport } = useLocalWorkspace()

  const safeName = transcript.title.substring(0, 50).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')

  const handleCopy = async () => {
    const text = generateClipboardText(transcript)
    const success = await copy(text)
    if (success) {
      track('export_copy', transcript.videoId)
      addExport({ videoId: transcript.videoId, title: transcript.title, format: 'copy' })
    }
  }

  const handleDownloadMd = () => {
    const md = generateMarkdown(transcript, variants || undefined, seo || undefined)
    downloadFile(md, `${safeName}.md`, 'text/markdown;charset=utf-8')
    track('export_md', transcript.videoId)
    addExport({ videoId: transcript.videoId, title: transcript.title, format: 'md' })
  }

  const handleDownloadTxt = () => {
    const txt = generatePlainText(transcript, variants || undefined)
    downloadFile(txt, `${safeName}.txt`, 'text/plain;charset=utf-8')
    track('export_txt', transcript.videoId)
    addExport({ videoId: transcript.videoId, title: transcript.title, format: 'txt' })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleDownloadMd}>
        <Download className="w-4 h-4 mr-2" />
        Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
        <FileText className="w-4 h-4 mr-2" />
        TXT
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <Check className="w-4 h-4 mr-2 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 mr-2" />
        )}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}
