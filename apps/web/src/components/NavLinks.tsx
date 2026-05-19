'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const links = [
  { href: '/youtube-transcript', label: 'YouTube Transcript' },
  { href: '/video-to-markdown', label: 'Video → Markdown' },
]

export function NavLinks() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="ml-auto flex items-center gap-1">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isActive(href)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {label}
        </Link>
      ))}
      <a
        href="https://github.com/YOUR_USERNAME/transcript-workflow-toolkit"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        GitHub
      </a>
    </div>
  )
}
