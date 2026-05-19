# Sitemap & SEO Route Structure

## Page Routes (MVP)

```
/
├── Home Page (Landing)
│   - Tool introduction
│   - URL input (YouTube primary, TikTok grayed out)
│   - SEO content about "YouTube transcript tool"
│   - Links to individual tool pages
│
├── /youtube-transcript
│   - Main tool page
│   - URL input form
│   - Transcript viewer (raw + cleaned toggle)
│   - Export buttons (MD, TXT, Copy)
│   - Static SEO content at bottom
│
├── /youtube-transcript/[slug]
│   - Programmatic SEO pages
│   - Each page = a cached transcript result
│   - Schema.org markup
│   - Example: /youtube-transcript/lex-fridman-sam-altman-openai
│
├── /tiktok-transcript (placeholder, grayed out)
│   - "Coming soon" page
│   - Email capture for launch notification
│
├── /video-to-markdown
│   - Redirect/alias to youtube-transcript
│   - SEO keyword capture ("video to markdown" search intent)
│
├── /sitemap.xml (dynamic)
│   - Auto-generated from cached transcripts
│   - Updated on each new transcript fetch
│
└── /api/*
    - API routes (see API_DESIGN.md)
```

## SEO Meta Structure

Each tool page must have:

```html
<title>{Video Title} - Transcript | Transcript Workflow Toolkit</title>
<meta name="description" content="Full transcript of {Video Title} with timestamps. Export to Markdown, TXT, or copy to clipboard." />
<meta property="og:title" content="{Video Title} - Transcript" />
<meta property="og:description" content="Searchable transcript with AI cleaning. Export to Obsidian, Notion, Markdown." />
<meta name="twitter:card" content="summary_large_image" />
```

## Schema.org Markup

Each transcript page gets structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "YouTube Transcript Tool",
  "description": "...",
  "applicationCategory": "Multimedia",
  "operatingSystem": "Web"
}
```

## Programmatic SEO Strategy

Target long-tail keywords:
- "youtube transcript [creator name]"
- "[video title] transcript"
- "convert youtube to markdown"
- "youtube video to text with timestamps"
- "export youtube transcript to obsidian"

Each cached transcript becomes a unique indexed page targeting the video's exact title as a long-tail keyword.
