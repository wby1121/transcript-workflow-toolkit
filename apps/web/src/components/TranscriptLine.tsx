interface TranscriptLineProps {
  timestamp: string
  text: string
  highlight?: boolean
}

export function TranscriptLine({ timestamp, text, highlight }: TranscriptLineProps) {
  return (
    <div className={`flex gap-3 py-1.5 px-2 rounded transition-colors ${highlight ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
      <span className="text-xs font-mono text-primary shrink-0 mt-0.5 select-none w-12 text-right">
        {timestamp}
      </span>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  )
}
