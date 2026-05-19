import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
  message: string
  onRetry?: () => void
  onReset?: () => void
}

export function ErrorDisplay({ message, onRetry, onReset }: ErrorDisplayProps) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive opacity-80" />
      <p className="text-lg font-medium text-destructive">Something went wrong</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{message}</p>
      <div className="flex gap-2 justify-center mt-4">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Try a different video
          </Button>
        )}
      </div>
    </div>
  )
}
