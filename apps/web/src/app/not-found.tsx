import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}
