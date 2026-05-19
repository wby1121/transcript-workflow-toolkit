import type { MetadataRoute } from 'next'
import { getAllSeoSlugs } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/youtube-transcript`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tiktok-transcript`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/video-to-markdown`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]

  try {
    const slugs = getAllSeoSlugs()
    const seoRoutes: MetadataRoute.Sitemap = slugs.map(({ slug, fetchedAt }) => ({
      url: `${baseUrl}/youtube-transcript/${slug}`,
      lastModified: new Date(fetchedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    return [...staticRoutes, ...seoRoutes]
  } catch {
    // DB might not be initialized yet
    return staticRoutes
  }
}
