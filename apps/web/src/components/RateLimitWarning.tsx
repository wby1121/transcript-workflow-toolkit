import { AlertCircle } from 'lucide-react'

interface RateLimitWarningProps {
  retryAfter: number
  onDismiss: () => void
}

export function RateLimitWarning({ retryAfter, onDismiss }: RateLimitWarningProps) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
      <AlertCircle className="w-5 h-5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">Too many requests</p>
        <p className="text-sm">Please wait {retryAfter} seconds before trying again.</p>
      </div>
      <button onClick={onDismiss} className="text-sm underline shrink-0">Dismiss</button>
    </div>
  )
}
