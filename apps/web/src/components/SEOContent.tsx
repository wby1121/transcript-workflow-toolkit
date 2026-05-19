export function SEOContent() {
  return (
    <section className="prose prose-sm max-w-none dark:prose-invert mt-16 pt-8 border-t">
      <h2>Free YouTube Transcript Tool</h2>
      <p>
        Extract full transcripts from any YouTube video with timestamps. Export to Markdown, TXT,
        or copy to clipboard. Perfect for researchers, content creators, and knowledge workers
        who need to capture and organize video content.
      </p>

      <h3>Features</h3>
      <ul>
        <li>Instant transcript extraction — just paste a YouTube URL</li>
        <li>Timestamps preserved — every line includes the exact time</li>
        <li>AI-powered cleaning — remove filler words, generate summaries and key topics</li>
        <li>Multiple export formats — Markdown (Obsidian-ready), plain text, or copy to clipboard</li>
        <li>No account required — start using immediately</li>
        <li>Your history stays local — transcripts are saved in your browser</li>
      </ul>

      <h3>Supported URL Formats</h3>
      <ul>
        <li><code>youtube.com/watch?v=...</code></li>
        <li><code>youtu.be/...</code></li>
        <li><code>youtube.com/embed/...</code></li>
        <li><code>youtube.com/shorts/...</code></li>
      </ul>

      <h3>How It Works</h3>
      <ol>
        <li>Copy a YouTube video URL from your browser</li>
        <li>Paste it into the input field above</li>
        <li>Click &quot;Get Transcript&quot;</li>
        <li>View the full transcript with timestamps</li>
        <li>Export as Markdown, TXT, or copy to clipboard</li>
      </ol>
    </section>
  )
}
