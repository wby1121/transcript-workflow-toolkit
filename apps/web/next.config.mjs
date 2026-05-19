// Sentry is optional — only wraps config if DSN is set and package is installed
let withSentryConfig = null
try {
  const sentry = await import('@sentry/nextjs')
  withSentryConfig = sentry.withSentryConfig
} catch {
  // @sentry/nextjs not installed — fine, skip Sentry
}

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs unsafe-eval for dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "font-src 'self'",
      "connect-src 'self' https://api.deepseek.com https://www.googleapis.com https://i.ytimg.com https://img.youtube.com",
      "frame-src 'self' https://www.youtube.com",
      "media-src 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

const sentryConfigured = withSentryConfig && !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN)

const finalConfig = sentryConfigured
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || '',
      project: process.env.SENTRY_PROJECT || '',
      silent: !process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
    })
  : nextConfig

export default finalConfig
